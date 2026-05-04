#!/bin/bash
# setup.sh - Infrastructure setup for Document Processing Pipeline
# Run this script to provision the necessary GCP resources.

# Exit immediately if a command exits with a non-zero status
set -e

# Configuration Variables
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
BUCKET_NAME="${PROJECT_ID}-upload-bucket-$(date +%s)"
TOPIC_NAME="document-upload-topic"
SERVICE_NAME="document-processor-service"
SERVICE_ACCOUNT="doc-processor-sa"
BQ_DATASET="document_processing"
BQ_TABLE="metadata"

echo "====================================================="
echo "Setting up Document Processing Pipeline on Google Cloud"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "====================================================="

# 1. Enable Required APIs
echo "--> Enabling necessary APIs..."
gcloud services enable \
    run.googleapis.com \
    pubsub.googleapis.com \
    storage.googleapis.com \
    bigquery.googleapis.com \
    eventarc.googleapis.com \
    cloudbuild.googleapis.com

# 2. Create BigQuery Dataset and Table
echo "--> Creating BigQuery Dataset ($BQ_DATASET)..."
bq mk -f --dataset --location=$REGION ${PROJECT_ID}:${BQ_DATASET} || true

echo "--> Creating BigQuery Table ($BQ_TABLE)..."
bq mk -f --table \
    --schema "filename:STRING,date:TIMESTAMP,tags:STRING,word_count:INTEGER" \
    ${PROJECT_ID}:${BQ_DATASET}.${BQ_TABLE} || true

# 3. Create Cloud Storage Bucket
echo "--> Creating Cloud Storage Bucket ($BUCKET_NAME)..."
gcloud storage buckets create gs://$BUCKET_NAME --location=$REGION --uniform-bucket-level-access

# 4. Create Pub/Sub Topic
echo "--> Creating Pub/Sub Topic ($TOPIC_NAME)..."
gcloud pubsub topics create $TOPIC_NAME || true

# 5. Give Cloud Storage service account permission to publish to Pub/Sub
echo "--> Granting Storage Service Account permission to publish..."
STORAGE_SA=$(gsutil kms serviceaccount -p $PROJECT_ID)
gcloud pubsub topics add-iam-policy-binding $TOPIC_NAME \
    --member="serviceAccount:$STORAGE_SA" \
    --role="roles/pubsub.publisher"

# 6. Configure Storage Notifications to Pub/Sub
echo "--> Configuring Storage Notifications..."
gcloud storage service-agent --project=$PROJECT_ID
gcloud storage buckets notifications create gs://$BUCKET_NAME \
    --topic=$TOPIC_NAME \
    --event-types=OBJECT_FINALIZE

# 7. Create Service Account for Cloud Run
echo "--> Creating Service Account for Cloud Run ($SERVICE_ACCOUNT)..."
gcloud iam service-accounts create $SERVICE_ACCOUNT \
    --display-name="Document Processor Service Account" || true

# Grant BigQuery permissions to Service Account
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/bigquery.dataEditor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/storage.objectViewer"

# 8. Deploy to Cloud Run
echo "--> Deploying service to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --source . \
    --region=$REGION \
    --no-allow-unauthenticated \
    --service-account="${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --set-env-vars="BQ_DATASET=$BQ_DATASET,BQ_TABLE=$BQ_TABLE"

# Get the URL of the deployed service
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
echo "Service deployed to: $SERVICE_URL"

# 9. Create Pub/Sub Push Subscription
echo "--> Creating Pub/Sub Push Subscription..."
# Enable Pub/Sub to create authentication tokens
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
PUBSUB_SA="serviceAccount:service-${PROJECT_NUMBER}@gcp-sa-pubsub.iam.gserviceaccount.com"

# Grant Pub/Sub identity token creator role
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member=$PUBSUB_SA \
    --role="roles/iam.serviceAccountTokenCreator" || true

# Create push subscription
SUBSCRIPTION_NAME="${TOPIC_NAME}-push-sub"
gcloud pubsub subscriptions create $SUBSCRIPTION_NAME \
    --topic=$TOPIC_NAME \
    --push-endpoint=$SERVICE_URL \
    --push-auth-service-account="${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com" || true

echo "====================================================="
echo "Setup Complete!"
echo "Upload a file to gs://$BUCKET_NAME to test the pipeline."
echo "====================================================="
