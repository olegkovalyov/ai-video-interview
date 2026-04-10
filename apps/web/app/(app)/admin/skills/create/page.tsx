"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSkillCategories, useCreateSkill } from "@/lib/query/hooks/use-skills";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export default function CreateSkillPage() {
  const router = useRouter();
  const { data: categoriesData } = useSkillCategories();
  const createMutation = useCreateSkill();
  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    categoryId: "",
    description: "",
  });

  // Auto-select first category when loaded
  if (categories.length > 0 && !formData.categoryId && categories[0]) {
    setFormData((prev) => ({ ...prev, categoryId: categories[0]!.id }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData, {
      onSuccess: () => router.push("/admin/skills"),
    });
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    }));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/admin/skills"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Skills
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Create New Skill
        </h1>
        <p className="text-sm text-muted-foreground">
          Add a new technical skill to the system
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <h2 className="text-lg font-semibold text-foreground">Skill Details</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. React, TypeScript, Docker"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Slug <span className="text-destructive">*</span></Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="e.g. react, typescript, docker"
                required
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly version (auto-generated from name)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Category <span className="text-destructive">*</span></Label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                className={selectClass}
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the skill..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button asChild type="button" variant="outline" size="sm">
                <Link href="/admin/skills">Cancel</Link>
              </Button>
              <Button type="submit" size="sm" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : <><Save className="mr-2 h-4 w-4" />Create Skill</>}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
