import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import EmptyState from "../components/shared/EmptyState";
import LoadingSkeleton from "../components/shared/LoadingSkeleton";
import Pagination from "../components/shared/Pagination";
import useDebounce from "../hooks/useDebounce";
import usePharmacy from "../hooks/usePharmacy";
import { BADGE_VARIANTS, STATUS } from "../utils/constants";
import { formatCurrency } from "../utils/helpers";

const schema = z.object({
  medicine_name: z.string().min(2, "Medicine name required"),
  manufacturer: z.string().optional(),
  stock: z.coerce.number().min(0, "Stock is required"),
  price: z.coerce.number().min(0, "Price is required"),
  status: z.enum(STATUS.pharmacy),
});

export default function Pharmacy() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading, error, createMedicine, updateMedicine, creating, updating } = usePharmacy({
    page: 1,
    limit: 200,
    search: debouncedSearch,
  });
  const items = data?.items || [];
  const totalPages = Math.max(1, Math.ceil(items.length / 10));
  const pagedItems = useMemo(() => items.slice((page - 1) * 10, page * 10), [items, page]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { medicine_name: "", manufacturer: "", stock: 0, price: 0, status: "Active" },
  });

  const saveMedicine = async (values) => {
    if (editing) {
      await updateMedicine({ id: editing.id, payload: values });
    } else {
      await createMedicine(values);
    }
    setOpen(false);
    setEditing(null);
    form.reset({ medicine_name: "", manufacturer: "", stock: 0, price: 0, status: "Active" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Pharmacy</h1>
          <p className="text-sm text-slate-500">Manage live pharmacy inventory and pricing.</p>
        </div>
        <Button className="bg-sky-600 hover:bg-sky-700" onClick={() => setOpen(true)}>
          Add Medicine
        </Button>
      </div>

      <Input
        placeholder="Search medicine or manufacturer"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
      />

      {isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : error ? (
        <EmptyState
          title="Pharmacy unavailable"
          description={error.message || "Unable to load pharmacy inventory."}
        />
      ) : pagedItems.length === 0 ? (
        <EmptyState title="No medicines" description="Create the first pharmacy item." />
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.medicine_name}</TableCell>
                  <TableCell>{item.manufacturer || "-"}</TableCell>
                  <TableCell>{item.stock}</TableCell>
                  <TableCell>{formatCurrency(item.price)}</TableCell>
                  <TableCell>
                    <Badge variant={BADGE_VARIANTS[item.status] || "secondary"}>{item.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditing(item);
                        form.reset({
                          medicine_name: item.medicine_name,
                          manufacturer: item.manufacturer || "",
                          stock: Number(item.stock || 0),
                          price: Number(item.price || 0),
                          status: item.status,
                        });
                        setOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Update Medicine" : "Create Medicine"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Medicine Name</label>
              <Input {...form.register("medicine_name")} placeholder="Medicine name" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Manufacturer</label>
              <Input {...form.register("manufacturer")} placeholder="Manufacturer" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Stock</label>
              <Input type="number" {...form.register("stock")} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Price</label>
              <Input type="number" step="0.01" {...form.register("price")} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Status</label>
              <Select value={form.watch("status")} onValueChange={(value) => form.setValue("status", value)}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {STATUS.pharmacy.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="bg-sky-600 hover:bg-sky-700" onClick={form.handleSubmit(saveMedicine)} disabled={creating || updating}>
              {creating || updating ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

