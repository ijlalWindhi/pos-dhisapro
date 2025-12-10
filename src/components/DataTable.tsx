import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import '@/styles/card.css';
import '@/styles/button.css';

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
}

export function DataTable<TData>({
  data,
  columns,
  isLoading = false,
  emptyMessage = 'Tidak ada data',
  emptyIcon,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageSize, setPageSize] = useState(10);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const totalRows = data.length;
  const startRow = pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="data-table">
      {/* Per Page Selector */}
      <div className="data-table-header">
        <div className="data-table-info">
          {!isLoading && totalRows > 0 && (
            <span>Menampilkan {startRow}-{endRow} dari {totalRows}</span>
          )}
        </div>
        <div className="data-table-perpage">
          <span>Per halaman:</span>
          <select
            className="form-select"
            value={pageSize}
            onChange={(e) => {
              const size = Number(e.target.value);
              setPageSize(size);
              table.setPageSize(size);
            }}
            style={{ width: 'auto', minHeight: '32px', padding: '4px 28px 4px 8px' }}
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                    style={{
                      cursor: header.column.getCanSort() ? 'pointer' : 'default',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span style={{ opacity: header.column.getIsSorted() ? 1 : 0.3 }}>
                          {header.column.getIsSorted() === 'asc' ? (
                            <ChevronUp size={14} />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ChevronDown size={14} />
                          ) : (
                            <ChevronUp size={14} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
                  <div className="spinner" style={{ margin: '0 auto' }}></div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="empty-state" style={{ padding: 'var(--spacing-8)' }}>
                    {emptyIcon && <div className="empty-state-icon">{emptyIcon}</div>}
                    <div className="empty-state-title">{emptyMessage}</div>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="data-table-pagination">
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            title="Halaman pertama"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            title="Sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>
          
          <span className="data-table-page-info">
            {pageIndex + 1} / {pageCount}
          </span>

          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            title="Selanjutnya"
          >
            <ChevronRight size={16} />
          </button>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
            title="Halaman terakhir"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
