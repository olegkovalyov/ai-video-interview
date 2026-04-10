"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle, MessageSquare, BarChart3 } from "lucide-react";

const MOCK_STATS = [
  {
    label: "Total Templates",
    value: 24,
    icon: FileText,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Active",
    value: 18,
    icon: CheckCircle,
    color: "text-success",
    bg: "bg-success-light",
  },
  {
    label: "Total Responses",
    value: 342,
    icon: MessageSquare,
    color: "text-info",
    bg: "bg-info-light",
  },
  {
    label: "Avg Score",
    value: "84%",
    icon: BarChart3,
    color: "text-warning",
    bg: "bg-warning-light",
  },
];

const MOCK_TEMPLATES = [
  {
    id: "1",
    title: "Frontend Developer Interview",
    createdBy: "Jane Smith (HR)",
    status: "active",
    candidates: 15,
    responses: 12,
    avgScore: "86%",
  },
  {
    id: "2",
    title: "Backend Engineer Interview",
    createdBy: "Mike Johnson (HR)",
    status: "active",
    candidates: 22,
    responses: 18,
    avgScore: "79%",
  },
  {
    id: "3",
    title: "DevOps Assessment",
    createdBy: "Jane Smith (HR)",
    status: "draft",
    candidates: 0,
    responses: 0,
    avgScore: "—",
  },
];

export default function AdminInterviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Interview Management
          </h1>
          <Badge variant="warning">Mock Data</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Monitor interview templates and activity across the platform
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {MOCK_STATS.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}
              >
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-foreground">
            Interview Templates
          </h2>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {MOCK_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {template.title}
                    </p>
                    <Badge
                      variant={
                        template.status === "active" ? "success" : "secondary"
                      }
                    >
                      {template.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{template.createdBy}</span>
                    <span>{template.candidates} candidates</span>
                    <span>{template.responses} responses</span>
                    <span>Avg: {template.avgScore}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
