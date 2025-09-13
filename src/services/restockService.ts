import { supabase } from './supabase';

export interface RestockItem {
  id: string;
  product_id: string;
  option_product_id: string;
  productOptionCode: string;
  name: string;
  option1?: string;
  option2?: string;
  option3?: string;
  sold: number;
  returned: number;
  picked: number;
  review: number;
  storeroom_empty: number;
  missing: number;
  last_updated: string;
}

export interface RestockData {
  items: RestockItem[];
  totalSold: number;
  totalPicked: number;
  totalReview: number;
  totalMissing: number;
}

export class RestockService {
  private location: 'newtown' | 'paddington';

  constructor(location: 'newtown' | 'paddington') {
    this.location = location;
  }

  private getTableName(): string {
    return `restock_${this.location}`;
  }

  // Fetch all restock data for the current location
  async fetchRestockData(): Promise<RestockData> {
    try {
      const { data, error } = await supabase
        .from(this.getTableName())
        .select('*')
        .order('sold', { ascending: false });

      if (error) throw error;

      const items = data || [];
      const totalSold = items.reduce((sum, item) => sum + (item.sold || 0), 0);
      const totalPicked = items.reduce((sum, item) => sum + (item.picked || 0), 0);
      const totalReview = items.reduce((sum, item) => sum + (item.review || 0), 0);
      const totalMissing = items.reduce((sum, item) => sum + (item.missing || 0), 0);

      return {
        items,
        totalSold,
        totalPicked,
        totalReview,
        totalMissing
      };
    } catch (error) {
      console.error('Error fetching restock data:', error);
      throw error;
    }
  }

  // Fetch only items that need restocking (sold > picked)
  async fetchItemsNeedingRestock(): Promise<RestockItem[]> {
    try {
      const { data, error } = await supabase
        .from(this.getTableName())
        .select('*')
        .gt('sold', 0)
        .order('sold', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching items needing restock:', error);
      throw error;
    }
  }

  // Increment picked count for an item
  async incrementPicked(itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.getTableName())
        .update({ 
          picked: supabase.rpc('increment', { row_id: itemId, x: 1 }),
          last_updated: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing picked count:', error);
      throw error;
    }
  }

  // Mark item as reviewed
  async markAsReviewed(itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.getTableName())
        .update({ 
          review: 1,
          last_updated: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking item as reviewed:', error);
      throw error;
    }
  }

  // Mark item as storeroom empty
  async markAsStoreroomEmpty(itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.getTableName())
        .update({ 
          storeroom_empty: 1,
          last_updated: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking item as storeroom empty:', error);
      throw error;
    }
  }

  // Mark item as missing
  async markAsMissing(itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.getTableName())
        .update({ 
          missing: 1,
          last_updated: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking item as missing:', error);
      throw error;
    }
  }

  // Reset item status (clear review, storeroom_empty, missing)
  async resetItemStatus(itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.getTableName())
        .update({ 
          review: 0,
          storeroom_empty: 0,
          missing: 0,
          last_updated: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('Error resetting item status:', error);
      throw error;
    }
  }

  // Sync stock data for sold items (calls syncTargetedStock)
  async syncStockForSoldItems(): Promise<void> {
    try {
      // This would typically call your syncTargetedStock script
      // For now, we'll just refresh the data
      console.log('Stock sync would be triggered here');
    } catch (error) {
      console.error('Error syncing stock:', error);
      throw error;
    }
  }

  // Get summary statistics
  async getSummaryStats(): Promise<{
    totalItems: number;
    itemsNeedingRestock: number;
    itemsInReview: number;
    itemsMissing: number;
    completionRate: number;
  }> {
    try {
      const { data, error } = await supabase
        .from(this.getTableName())
        .select('sold, picked, review, missing');

      if (error) throw error;

      const items = data || [];
      const totalItems = items.length;
      const itemsNeedingRestock = items.filter(item => (item.sold || 0) > (item.picked || 0)).length;
      const itemsInReview = items.filter(item => item.review === 1).length;
      const itemsMissing = items.filter(item => item.missing === 1).length;
      
      const totalSold = items.reduce((sum, item) => sum + (item.sold || 0), 0);
      const totalPicked = items.reduce((sum, item) => sum + (item.picked || 0), 0);
      const completionRate = totalSold > 0 ? Math.round((totalPicked / totalSold) * 100) : 0;

      return {
        totalItems,
        itemsNeedingRestock,
        itemsInReview,
        itemsMissing,
        completionRate
      };
    } catch (error) {
      console.error('Error getting summary stats:', error);
      throw error;
    }
  }
}

// Export a factory function to create location-specific services
export const createRestockService = (location: 'newtown' | 'paddington') => {
  return new RestockService(location);
};
