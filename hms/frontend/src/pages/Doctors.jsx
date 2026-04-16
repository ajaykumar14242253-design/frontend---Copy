import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Stethoscope, LayoutGrid, List, Star, Search, Filter, Plus,
  Calendar, Phone, Mail, Clock, Award, Users, Activity, ChevronRight,
  Edit2, Trash2, Eye, MoreVertical, X, CheckCircle, AlertCircle,
  Briefcase, MessageSquare, Video, FileText, Download, RefreshCw,
  ChevronDown, StarIcon, TrendingUp, CalendarCheck, Clock3, Check
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Textarea } from "../components/ui/textarea";
import LoadingSkeleton from "../components/shared/LoadingSkeleton";
import EmptyState from "../components/shared/EmptyState";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import Pagination from "../components/shared/Pagination";
import useDebounce from "../hooks/useDebounce";
import useDoctors from "../hooks/useDoctors";
import useAppointments from "../hooks/useAppointments";
import useDepartments from "../hooks/useDepartments";

const SPECIALIZATIONS = [
  "Cardiology", "Neurology", "Orthopedics", "Pediatrics", "General Medicine",
  "Dermatology", "Oncology", "Gynecology", "ENT", "Psychiatry",
  "Gastroenterology", "Pulmonology", "Nephrology", "Endocrinology", "Rheumatology"
];

const STATUS_CONFIG = {
  Available: { color: "emerald", bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle, label: "Available" },
  "In Surgery": { color: "orange", bg: "bg-orange-100", text: "text-orange-700", icon: Activity, label: "In Surgery" },
  "On Leave": { color: "gray", bg: "bg-slate-100", text: "text-slate-600", icon: Clock, label: "On Leave" },
  Offline: { color: "red", bg: "bg-red-100", text: "text-red-700", icon: AlertCircle, label: "Offline" },
  "On Call": { color: "blue", bg: "bg-blue-100", text: "text-blue-700", icon: Phone, label: "On Call" },
};

const SPECIALTY_COLORS = {
  Cardiology: "bg-rose-100 text-rose-700 border-rose-200",
  Neurology: "bg-purple-100 text-purple-700 border-purple-200",
  Orthopedics: "bg-amber-100 text-amber-700 border-amber-200",
  Pediatrics: "bg-pink-100 text-pink-700 border-pink-200",
  "General Medicine": "bg-sky-100 text-sky-700 border-sky-200",
  Dermatology: "bg-teal-100 text-teal-700 border-teal-200",
  Oncology: "bg-indigo-100 text-indigo-700 border-indigo-200",
  Gynecology: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  ENT: "bg-cyan-100 text-cyan-700 border-cyan-200",
  Psychiatry: "bg-violet-100 text-violet-700 border-violet-200",
};

const schema = z.object({
  name: z.string().min(2, "Name required"),
  specialization: z.string().min(1, "Specialization required"),
  qualification: z.string().optional(),
  experience: z.coerce.number().min(0).max(50).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  availability: z.string().default("Available"),
  rating: z.coerce.number().min(0).max(5).optional(),
  bio: z.string().optional(),
  status: z.string().optional(),
  department_id: z.coerce.number().optional(),
});

export default function Doctors() {
  const [search, setSearch] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [profileDialog, setProfileDialog] = useState(null);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [quickFilters, setQuickFilters] = useState([]);

  const debouncedSearch = useDebounce(search, 300);
  const {
    data,
    isLoading,
    error,
    createDoctor,
    updateDoctor,
    deleteDoctor,
    creating,
    updating,
    refetch,
  } = useDoctors({ page: 1, limit: 200, search: debouncedSearch });

  const { data: deptData } = useDepartments({ limit: 100 });
  const { data: appointmentsData } = useAppointments({ page: 1, limit: 1000 });

  const doctors = useMemo(() => data?.items || [], [data?.items]);
  const departments = deptData?.items || [];
  const appointments = appointmentsData?.items || [];

  const stats = useMemo(() => {
    const total = doctors.length;
    const available = doctors.filter(d => d?.availability === "Available").length;
    const inSurgery = doctors.filter(d => d?.availability === "In Surgery").length;
    const onLeave = doctors.filter(d => d?.availability === "On Leave").length;
    const avgRating = doctors.length > 0
      ? doctors.reduce((sum, d) => sum + Number(d?.rating || 0), 0) / doctors.length
      : 0;
    const specialties = new Set(doctors.map(d => d?.specialization).filter(Boolean)).size;

    return { total, available, inSurgery, onLeave, avgRating, specialties };
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    let items = [...doctors];

    if (specializationFilter !== "all") {
      items = items.filter(d => d?.specialization === specializationFilter);
    }
    if (statusFilter !== "all") {
      items = items.filter(d => d?.availability === statusFilter);
    }
    if (quickFilters.includes("high_rated")) {
      items = items.filter(d => Number(d?.rating || 0) >= 4.7);
    }
    if (quickFilters.includes("experienced")) {
      items = items.filter(d => (d?.experience || 0) >= 10);
    }

    items.sort((a, b) => {
      if (sortBy === "name") return (a?.name || "").localeCompare(b?.name || "");
      if (sortBy === "experience") return (b?.experience || 0) - (a?.experience || 0);
      if (sortBy === "rating") return (Number(b?.rating || 0)) - (Number(a?.rating || 0));
      return 0;
    });

    return items;
  }, [doctors, specializationFilter, statusFilter, sortBy, quickFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / 12));
  const pagedDoctors = filteredDoctors.slice((page - 1) * 12, page * 12);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", specialization: "", qualification: "", experience: 0,
      phone: "", email: "", availability: "Available", rating: 0, bio: "", status: "Active",
    },
  });

  const toggleQuickFilter = (filter) => {
    setQuickFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
    setPage(1);
  };

  const handleOpenProfile = (doctor) => setProfileDialog(doctor);
  const handleEdit = (doctor) => {
    setEditing(doctor);
    form.reset({
      name: doctor?.name || "",
      specialization: doctor?.specialization || "",
      qualification: doctor?.qualification || "",
      experience: doctor?.experience || 0,
      phone: doctor?.phone || "",
      email: doctor?.email || "",
      availability: doctor?.availability || "Available",
      rating: Number(doctor?.rating || 0),
      bio: doctor?.bio || "",
      status: doctor?.status || "Active",
    });
    setAddDialogOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editing) {
        await updateDoctor({ id: editing.id, payload: values });
      } else {
        await createDoctor(values);
      }
      setAddDialogOpen(false);
      setEditing(null);
      form.reset();
    } catch (err) {
      console.error("Error saving doctor:", err);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteDoctor(confirmDelete.id);
    setConfirmDelete(null);
  };

  const toggleSelectAll = () => {
    if (selectedDoctors.length === pagedDoctors.length) {
      setSelectedDoctors([]);
    } else {
      setSelectedDoctors(pagedDoctors.map(d => d.id));
    }
  };

  const toggleSelectDoctor = (id) => {
    setSelectedDoctors(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getDoctorAppointments = (doctorId) => {
    return appointments.filter(a => a.doctor_id === doctorId).length;
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-3 w-3 ${i < fullStars ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
        />
      );
    }
    return stars;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-sky-600" />
            Doctor Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage doctor profiles, availability, and appointments
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              className={`rounded-none ${viewMode === "grid" ? "bg-sky-600" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              className={`rounded-none ${viewMode === "table" ? "bg-sky-600" : ""}`}
              onClick={() => setViewMode("table")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button className="bg-sky-600 hover:bg-sky-700" onClick={() => { setEditing(null); form.reset(); setAddDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Doctor
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        <Card className="bg-gradient-to-br from-sky-50 to-white dark:from-sky-900/20 dark:to-slate-900 border-sky-200 dark:border-sky-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-sky-100 dark:bg-sky-900/50 p-2.5">
                <Users className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                <p className="text-xs text-slate-500">Total Doctors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900 border-emerald-200 dark:border-emerald-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 dark:bg-emerald-900/50 p-2.5">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.available}</p>
                <p className="text-xs text-slate-500">Available Now</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-slate-900 border-orange-200 dark:border-orange-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-orange-100 dark:bg-orange-900/50 p-2.5">
                <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.inSurgery}</p>
                <p className="text-xs text-slate-500">In Surgery</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900 border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-200 dark:bg-slate-700 p-2.5">
                <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.onLeave}</p>
                <p className="text-xs text-slate-500">On Leave</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-900 border-amber-200 dark:border-amber-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-100 dark:bg-amber-900/50 p-2.5">
                <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.avgRating.toFixed(1)}</p>
                <p className="text-xs text-slate-500">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-slate-900 border-purple-200 dark:border-purple-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-100 dark:bg-purple-900/50 p-2.5">
                <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.specialties}</p>
                <p className="text-xs text-slate-500">Specialties</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, specialization, or experience..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 dark:bg-slate-800 dark:border-slate-700"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["high_rated", "experienced"].map(filter => (
            <Button
              key={filter}
              variant={quickFilters.includes(filter) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleQuickFilter(filter)}
              className={quickFilters.includes(filter) ? "bg-sky-600" : ""}
            >
              {filter === "high_rated" && <><Star className="h-3 w-3 mr-1" /> High Rated</>}
              {filter === "experienced" && <><Award className="h-3 w-3 mr-1" /> 10+ Years</>}
            </Button>
          ))}
        </div>
        <Select value={specializationFilter} onValueChange={(v) => { setSpecializationFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px] dark:bg-slate-800 dark:border-slate-700">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Specialty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specialties</SelectItem>
            {SPECIALIZATIONS.map(item => (
              <SelectItem key={item} value={item}>{item}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px] dark:bg-slate-800 dark:border-slate-700">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.keys(STATUS_CONFIG).map(item => (
              <SelectItem key={item} value={item}>{item}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px] dark:bg-slate-800 dark:border-slate-700">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="experience">Experience</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedDoctors.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-800">
          <span className="text-sm font-medium text-sky-700 dark:text-sky-300">
            {selectedDoctors.length} doctor(s) selected
          </span>
          <Button size="sm" variant="outline" onClick={() => setSelectedDoctors([])}>
            Clear
          </Button>
          <Button size="sm" variant="outline" className="ml-auto">
            <Download className="h-4 w-4 mr-2" />
            Export Selected
          </Button>
        </div>
      )}

      {isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : error ? (
        <EmptyState title="Doctors unavailable" description={error.message || "Unable to load doctors."} />
      ) : filteredDoctors.length === 0 ? (
        <EmptyState title="No doctors found" description="Try adjusting your search or filters." />
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pagedDoctors.map((doctor) => {
            const status = STATUS_CONFIG[doctor?.availability] || STATUS_CONFIG.Available;
            const StatusIcon = status.icon;
            const appointmentCount = getDoctorAppointments(doctor.id);

            return (
              <Card key={doctor.id} className="overflow-hidden hover:shadow-lg transition-shadow dark:bg-slate-900 dark:border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900 dark:to-sky-800 flex items-center justify-center text-sky-700 dark:text-sky-300 font-bold text-lg">
                          {doctor.name?.slice(0, 2).toUpperCase() || "DR"}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 ${status.color === 'emerald' ? 'bg-emerald-500' : status.color === 'orange' ? 'bg-orange-500' : status.color === 'gray' ? 'bg-slate-400' : status.color === 'red' ? 'bg-red-500' : 'bg-blue-500'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1">{doctor.name}</h3>
                        <Badge className={`text-xs ${SPECIALTY_COLORS[doctor.specialization] || "bg-slate-100 text-slate-700"}`}>
                          {doctor.specialization}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400">{doctor.experience || 0} yrs</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex">{renderStars(Number(doctor.rating) || 0)}</div>
                      <span className="text-slate-500">({Number(doctor.rating || 0).toFixed(1)})</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <Badge className={`${status.bg} ${status.text} border`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                    <span className="text-xs text-slate-500">{appointmentCount} appointments</span>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleOpenProfile(doctor)}>
                      <Eye className="h-3 w-3 mr-1" />
                      Profile
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(doctor)}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirmDelete(doctor)} className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedDoctors.length === pagedDoctors.length && pagedDoctors.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300"
                  />
                </TableHead>
                <TableHead className="font-semibold">Doctor</TableHead>
                <TableHead className="font-semibold">Specialty</TableHead>
                <TableHead className="font-semibold">Experience</TableHead>
                <TableHead className="font-semibold">Rating</TableHead>
                <TableHead className="font-semibold">Appointments</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedDoctors.map((doctor) => {
                const status = STATUS_CONFIG[doctor?.availability] || STATUS_CONFIG.Available;
                const StatusIcon = status.icon;
                return (
                  <TableRow key={doctor.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedDoctors.includes(doctor.id)}
                        onChange={() => toggleSelectDoctor(doctor.id)}
                        className="rounded border-slate-300"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
                          status.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                          status.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                          'bg-sky-100 text-sky-700'
                        }`}>
                          {doctor.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{doctor.name}</p>
                          <p className="text-xs text-slate-500">{doctor.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={SPECIALTY_COLORS[doctor.specialization] || "bg-slate-100 text-slate-700"}>
                        {doctor.specialization}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{doctor.experience || 0}</span>
                      <span className="text-slate-500 text-sm"> yrs</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <div className="flex">{renderStars(Number(doctor.rating) || 0)}</div>
                        <span className="text-sm text-slate-600 ml-1">{Number(doctor.rating || 0).toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{getDoctorAppointments(doctor.id)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${status.bg} ${status.text} border`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleOpenProfile(doctor)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(doctor)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(doctor)} className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-sky-600" />
              {editing ? "Edit Doctor" : "Add New Doctor"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Full Name *</label>
                <Input {...form.register("name")} placeholder="Dr. John Smith" />
                {form.formState.errors.name && <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Specialization *</label>
                <Select value={form.watch("specialization")} onValueChange={(v) => form.setValue("specialization", v)}>
                  <SelectTrigger><SelectValue placeholder="Select specialty" /></SelectTrigger>
                  <SelectContent>
                    {SPECIALIZATIONS.map(item => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.specialization && <p className="text-xs text-red-500 mt-1">{form.formState.errors.specialization.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Qualification</label>
                <Input {...form.register("qualification")} placeholder="MD, PhD" />
              </div>
              <div>
                <label className="text-sm font-medium">Experience (years)</label>
                <Input type="number" {...form.register("experience")} min="0" max="50" />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input type="email" {...form.register("email")} placeholder="doctor@hospital.com" />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input {...form.register("phone")} placeholder="+91 XXXXXXXXXX" />
              </div>
              <div>
                <label className="text-sm font-medium">Availability</label>
                <Select value={form.watch("availability")} onValueChange={(v) => form.setValue("availability", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(STATUS_CONFIG).map(item => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={form.watch("status") || "Active"} onValueChange={(v) => form.setValue("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Bio</label>
              <Textarea {...form.register("bio")} placeholder="Brief professional bio..." rows={3} />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-sky-600 hover:bg-sky-700" disabled={creating || updating}>
                {creating || updating ? "Saving..." : editing ? "Update Doctor" : "Add Doctor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!profileDialog} onOpenChange={() => setProfileDialog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900 dark:to-sky-800 flex items-center justify-center text-sky-700 dark:text-sky-300 font-bold text-xl">
                {profileDialog?.name?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold">{profileDialog?.name}</h2>
                <Badge className={SPECIALTY_COLORS[profileDialog?.specialization] || "bg-slate-100"}>
                  {profileDialog?.specialization}
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Contact Information</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span>{profileDialog?.email || "Not provided"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>{profileDialog?.phone || "Not provided"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span>{profileDialog?.experience || 0} years experience</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Rating & Reviews</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-3xl font-bold">{Number(profileDialog?.rating || 0).toFixed(1)}</div>
                      <div className="flex">{renderStars(Number(profileDialog?.rating) || 0)}</div>
                    </div>
                    <Progress value={(Number(profileDialog?.rating) || 0) * 20} className="h-2" />
                  </CardContent>
                </Card>
              </div>
              {profileDialog?.bio && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">About</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{profileDialog.bio}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="schedule">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Weekly Schedule</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day => (
                      <div key={day} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                        <span className="font-medium">{day}</span>
                        <Badge variant="outline">9:00 AM - 5:00 PM</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="performance">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-2xl font-bold">{getDoctorAppointments(profileDialog?.id)}</p>
                    <p className="text-sm text-slate-500">Total Appointments</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-2xl font-bold">{Math.floor(getDoctorAppointments(profileDialog?.id) * 0.92)}</p>
                    <p className="text-sm text-slate-500">Completed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-2xl font-bold text-emerald-600">98%</p>
                    <p className="text-sm text-slate-500">Satisfaction</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileDialog(null)}>Close</Button>
            <Button onClick={() => { setProfileDialog(null); handleEdit(profileDialog); }}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
        title="Delete Doctor?"
        description={`This will permanently remove ${confirmDelete?.name} from the system.`}
        confirmText="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
