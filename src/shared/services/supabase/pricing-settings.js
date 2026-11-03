import { supabase } from './client.js';
import { parsePricingSettings } from '../../../features/pricing/model/pricing.js';

export async function getPricingSettings() {
  const { data, error } = await supabase
    .from('AppSetting')
    .select('key,value')
    .in('key', ['usd_to_dzd_rate', 'service_fee_dzd', 'exchange_rate_source', 'exchange_rate_updated_at']);
  if (error) throw error;
  return parsePricingSettings(data);
}
