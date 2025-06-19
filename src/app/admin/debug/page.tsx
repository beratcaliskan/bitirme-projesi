'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Download, Maximize2, Minimize2, RefreshCw, Database, Users, MapPin, CreditCard, ShoppingBag, Package, FileText, AlertTriangle } from 'lucide-react';

interface TableRow {
  id: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

interface TableData {
  [key: string]: TableRow[];
}

interface TableStats {
  users: number;
  addresses: number;
  payment_methods: number;
  products: number;
  orders: number;
  order_items: number;
}

export default function AdminDebugPage() {
  // SVG viewer states
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // Table data states
  const [activeTab, setActiveTab] = useState('users');
  const [tableData, setTableData] = useState<TableData>({});
  const [tableStats, setTableStats] = useState<TableStats>({
    users: 0,
    addresses: 0,
    payment_methods: 0,
    products: 0,
    orders: 0,
    order_items: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Define table order
  const tableOrder = ['users', 'addresses', 'payment_methods', 'products', 'orders', 'order_items'];

  // Zoom functions
  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev * 1.2, 5));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev / 1.2, 0.1));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Mouse event handlers for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX - position.x, 
      y: e.clientY - position.y 
    });
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(Math.max(prev * delta, 0.1), 5));
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Download SVG
  const downloadSvg = useCallback(() => {
    const link = document.createElement('a');
    link.href = '/supabase-sema.svg';
    link.download = 'supabase-schema.svg';
    link.click();
  }, []);

  // Fetch table data
  const fetchTableData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/debug/tables');
      if (!response.ok) {
        throw new Error('Veri alınamadı');
      }
      const data = await response.json();
      setTableData(data.tables);
      setTableStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData();
  }, []);

  // Table rendering helper
  const renderTable = (tableName: string, data: TableRow[]) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Bu tabloda veri bulunmuyor
        </div>
      );
    }

    const columns = Object.keys(data[0]);
    
    return (
      <div className="w-full">
        <div className="overflow-auto max-h-96 border rounded-lg">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="border border-gray-300 px-3 py-2 text-left text-sm font-medium whitespace-nowrap">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {columns.map((column) => (
                                      <td key={column} className="border border-gray-300 px-3 py-2 text-sm min-w-[120px] max-w-xs">
                    <div className="truncate" title={String(row[column] ?? '')}>
                      {typeof row[column] === 'object' && row[column] !== null
                        ? JSON.stringify(row[column]) 
                        : String(row[column] ?? '')}
                    </div>
                  </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Get table icon
  const getTableIcon = (tableName: string) => {
    const iconMap: { [key: string]: React.JSX.Element } = {
      users: <Users className="h-4 w-4" />,
      addresses: <MapPin className="h-4 w-4" />,
      payment_methods: <CreditCard className="h-4 w-4" />,
      products: <Package className="h-4 w-4" />,
      orders: <ShoppingBag className="h-4 w-4" />,
      order_items: <FileText className="h-4 w-4" />
    };
    return iconMap[tableName] || <Database className="h-4 w-4" />;
  };

  // Get table title
  const getTableTitle = (tableName: string) => {
    const titleMap: { [key: string]: string } = {
      users: 'Kullanıcılar',
      addresses: 'Adresler',
      payment_methods: 'Ödeme Yöntemleri',
      products: 'Ürünler',
      orders: 'Siparişler',
      order_items: 'Sipariş Öğeleri'
    };
    return titleMap[tableName] || tableName;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Debug Panel</h1>
        <p className="text-gray-600">Database şeması ve tablo verileri</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {Object.entries(tableStats).map(([tableName, count]) => (
          <div key={tableName} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2">
              {getTableIcon(tableName)}
              <div>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-gray-600">{getTableTitle(tableName)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-2 overflow-x-auto">
            {tableOrder.map((tableName) => (
              <button
                key={tableName}
                onClick={() => setActiveTab(tableName)}
                className={`py-2 px-3 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tableName
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {getTableIcon(tableName)}
                {getTableTitle(tableName)}
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {tableStats[tableName as keyof TableStats]}
                </span>
              </button>
            ))}
            <button
              onClick={() => setActiveTab('schema')}
              className={`py-2 px-3 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'schema'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Database className="h-4 w-4" />
              Database Şeması
            </button>
          </nav>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mb-4">
        <Button onClick={fetchTableData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Yenile
        </Button>
      </div>

      {/* Schema Tab Content */}
      {activeTab === 'schema' && (
        <>
          {/* Control Panel */}
          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              onClick={zoomIn}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ZoomIn className="h-4 w-4" />
              Yakınlaştır
            </Button>
            
            <Button
              onClick={zoomOut}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ZoomOut className="h-4 w-4" />
              Uzaklaştır
            </Button>
            
            <Button
              onClick={resetZoom}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Sıfırla
            </Button>
            
            <Button
              onClick={toggleFullscreen}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              {isFullscreen ? 'Küçült' : 'Tam Ekran'}
            </Button>
            
            <Button
              onClick={downloadSvg}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              İndir
            </Button>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Zoom: {Math.round(scale * 100)}%</span>
            </div>
          </div>

          {/* SVG Container */}
          <div 
            ref={containerRef}
            className={`
              border border-gray-300 rounded-lg overflow-hidden bg-white
              ${isFullscreen 
                ? 'fixed inset-0 z-50 rounded-none' 
                : 'h-[calc(100vh-200px)]'
              }
            `}
          >
            <div
              ref={svgContainerRef}
              className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing relative"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              <div
                className="transition-transform duration-100 ease-out"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transformOrigin: 'center center',
                  width: '100%',
                  height: '100%',
                }}
              >
                <div className="flex justify-center items-center min-h-full p-4">
                  <Image
                    src="/supabase-sema.svg"
                    alt="Database Schema Diagram"
                    width={800}
                    height={600}
                    className="max-w-none h-auto select-none"
                    style={{ 
                      minWidth: '800px',
                      pointerEvents: 'none'
                    }}
                    draggable={false}
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Fullscreen close button */}
            {isFullscreen && (
              <Button
                onClick={toggleFullscreen}
                className="absolute top-4 right-4 z-10"
                variant="secondary"
                size="sm"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Kullanım:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Fare tekerleği ile zoom yapabilirsiniz</li>
              <li>Sürükleyerek diyagramı hareket ettirebilirsiniz</li>
              <li>Tam ekran modunda daha rahat inceleyebilirsiniz</li>
              <li>SVG dosyasını bilgisayarınıza indirebilirsiniz</li>
            </ul>
          </div>
        </>
      )}

      {/* Individual Table Content */}
      {tableOrder.includes(activeTab) && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Veriler yükleniyor...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 min-h-96 flex items-center justify-center">
              <div>
                <AlertTriangle className="h-8 w-8 mx-auto mb-4" />
                <p className="font-medium">Hata oluştu</p>
                <p className="text-sm mt-2">{error}</p>
                <Button onClick={fetchTableData} className="mt-4">
                  Tekrar Dene
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium flex items-center space-x-2">
                  {getTableIcon(activeTab)}
                  <span>{getTableTitle(activeTab)} ({tableData[activeTab]?.length || 0} kayıt)</span>
                </h3>
              </div>
              <div className="p-6">
                {renderTable(activeTab, tableData[activeTab] || [])}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 