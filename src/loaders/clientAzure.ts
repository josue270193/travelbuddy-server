import { AzureKeyCredential, TextAnalyticsClient } from '@azure/ai-text-analytics';

const key = '75b34e6e56c946b999b3cf4ce6e6b184';
const endpoint = 'https://travelbuddy.cognitiveservices.azure.com/';
const ClientAzure = new TextAnalyticsClient(endpoint, new AzureKeyCredential(key));

export default ClientAzure;
