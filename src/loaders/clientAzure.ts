import { AzureKeyCredential, TextAnalyticsClient } from '@azure/ai-text-analytics';

const key = '2bfa9281f84948a08b8c567cc3bb6251';
const endpoint = 'https://travelbuddy-textanalytics.cognitiveservices.azure.com/';
const ClientAzure = new TextAnalyticsClient(endpoint, new AzureKeyCredential(key));

export default ClientAzure;
