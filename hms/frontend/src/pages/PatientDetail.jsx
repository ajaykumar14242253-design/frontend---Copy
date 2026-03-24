import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import LoadingSkeleton from "../components/shared/LoadingSkeleton";
import EmptyState from "../components/shared/EmptyState";
import api from "../lib/api";
import { BADGE_VARIANTS } from "../utils/constants";
import { formatDate } from "../utils/helpers";

/**
 * Patient detail view.
 */
export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      const response = await api.get(`/patients/${id}`);
      return response.data.data;
    },
    enabled: Boolean(id),
  });

  if (isLoading) {
    return <LoadingSkeleton rows={6} />;
  }

  if (!data) {
    if (error) {
      return (
        <EmptyState
          title="Patient unavailable"
          message={error.message || "Unable to load patient details."}
        />
      );
    }
    return <EmptyState title="Patient not found" message="Try another patient." />;
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={() => navigate(-1)}>
        Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{data?.name}</CardTitle>
          <Badge variant={BADGE_VARIANTS[data?.status] || "default"}>{data?.status}</Badge>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
          <div>
            <p className="font-medium text-slate-900">Email</p>
            <p>{data?.email || "-"}</p>
          </div>
          <div>
            <p className="font-medium text-slate-900">Phone</p>
            <p>{data?.phone || "-"}</p>
          </div>
          <div>
            <p className="font-medium text-slate-900">Blood Type</p>
            <p>{data?.blood_type || "-"}</p>
          </div>
          <div>
            <p className="font-medium text-slate-900">Gender</p>
            <p>{data?.gender || "-"}</p>
          </div>
          <div>
            <p className="font-medium text-slate-900">Age</p>
            <p>{data?.age ?? "-"}</p>
          </div>
          <div>
            <p className="font-medium text-slate-900">Created</p>
            <p>{formatDate(data?.created_at)}</p>
          </div>
          <div className="md:col-span-2">
            <p className="font-medium text-slate-900">Address</p>
            <p>{data?.address || "-"}</p>
          </div>
          <div className="md:col-span-2">
            <p className="font-medium text-slate-900">Medical History</p>
            <p>{data?.medical_history || "-"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

