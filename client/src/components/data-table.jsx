import * as React from "react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const columns = [
  {
    accessorKey: "_id",
    header: "Order ID",
    cell: ({ row }) => (row.original._id ? row.original._id.slice(-3) : "-"),
  },
  {
    accessorKey: "table",
    header: "Table",
    cell: ({ row }) => {
      const t = row.original.table;
      if (!t) return "-";
      return t.tableNumber || t.name || t._id || "-";
    },
  },
  // {
  //   accessorKey: "items",
  //   header: "Items",
  //   cell: ({ row }) =>
  //     Array.isArray(row.original.items)
  //       ? row.original.items.map((i) => i.item?.name || i.item || "").join(", ")
  //       : "-",
  // },
  {
    accessorKey: "totalAmount",
    header: "Total Amount",
    cell: ({ row }) => row.original.totalAmount?.toLocaleString() || "-",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => row.original.status,
  },
  {
    accessorKey: "attendant",
    header: "Attendant",
    cell: ({ row }) =>
      row.original.attendant?.name || row.original.attendant || "-",
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) =>
      row.original.createdAt
        ? new Date(row.original.createdAt).toLocaleString()
        : "-",
  },
];

export function DataTable({ data = [] }) {
  const [openOrder, setOpenOrder] = useState(null);

  return (
    <div className="overflow-x-auto w-full">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.accessorKey}>{col.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length ? (
            data.map((row, idx) => (
              <TableRow
                key={row._id || idx}
                className="cursor-pointer hover:bg-muted"
                onClick={() => setOpenOrder(row)}
              >
                {columns.map((col) => (
                  <TableCell key={col.accessorKey}>
                    {col.cell
                      ? col.cell({ row: { original: row } })
                      : row[col.accessorKey]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center">
                No orders found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Dialog open={!!openOrder} onOpenChange={() => setOpenOrder(null)}>
        <DialogContent>
          <DialogTitle>Order Items</DialogTitle>
          {openOrder && (
            <div>
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2">Item</th>
                    <th className="text-right p-2">Qty</th>
                    <th className="text-right p-2">PU</th>
                    <th className="text-right p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {openOrder.items && openOrder.items.length ? (
                    openOrder.items.map((i, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          {i.item?.name || i.item || "Unnamed item"}
                        </td>
                        <td className="p-2 text-right">{i.quantity}</td>
                        <td className="p-2 text-right">
                          {i.price?.toLocaleString() || "-"}
                        </td>
                        <td className="p-2 text-right">
                          {i.total?.toLocaleString() || "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-2 text-center">
                        No items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
