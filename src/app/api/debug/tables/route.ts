import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

interface TableStats {
  users: number;
  addresses: number;
  payment_methods: number;
  products: number;
  orders: number;
  order_items: number;
}

interface TableRow {
  id: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

interface TableData {
  [key: string]: TableRow[];
}

export async function GET() {
  try {
    // Define all tables to fetch
    const tables = [
      'users',
      'addresses', 
      'payment_methods',
      'products',
      'orders',
      'order_items'
    ];

    const tableData: TableData = {};
    const tableStats: TableStats = {
      users: 0,
      addresses: 0,
      payment_methods: 0,
      products: 0,
      orders: 0,
      order_items: 0
    };

    // Fetch data from each table
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error(`Error fetching ${tableName}:`, error);
          tableData[tableName] = [];
          tableStats[tableName as keyof TableStats] = 0;
        } else {
          tableData[tableName] = data || [];
          tableStats[tableName as keyof TableStats] = data?.length || 0;
        }
      } catch (err) {
        console.error(`Error processing table ${tableName}:`, err);
        tableData[tableName] = [];
        tableStats[tableName as keyof TableStats] = 0;
      }
    }

    return NextResponse.json({
      success: true,
      tables: tableData,
      stats: tableStats
    });

  } catch (error) {
    console.error('Debug API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch table data',
        tables: {},
        stats: {
          users: 0,
          addresses: 0,
          payment_methods: 0,
          products: 0,
          orders: 0,
          order_items: 0
        }
      },
      { status: 500 }
    );
  }
} 