"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

type Review = {
  id: string;
  productId: string;
  rating: number;
  comment: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  user: {
    name: string | null;
    email: string | null;
  }
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/admin/reviews");
      const data = await res.json();
      if (Array.isArray(data)) setReviews(data);
    } catch (error) {
      console.error("Failed to fetch reviews", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const updateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      await fetch("/api/admin/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      fetchReviews();
    } catch (error) {
      alert("Failed to update status");
    }
  };

  if (loading) return <div className="p-8">Loading reviews...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Product Reviews</h2>
        <p className="text-muted-foreground">Approve or reject customer reviews before they appear on the site.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 font-medium">Customer</th>
                  <th className="p-3 font-medium">Product ID</th>
                  <th className="p-3 font-medium">Rating</th>
                  <th className="p-3 font-medium">Comment</th>
                  <th className="p-3 font-medium text-center">Status</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground">No reviews found.</td>
                  </tr>
                ) : (
                  reviews.map(review => (
                    <tr key={review.id}>
                      <td className="p-3">
                        <div className="font-medium">{review.user.name || "Anonymous"}</div>
                        <div className="text-xs text-muted-foreground">{review.user.email}</div>
                      </td>
                      <td className="p-3 font-mono text-xs">{review.productId}</td>
                      <td className="p-3 font-bold text-yellow-600">{review.rating} / 5</td>
                      <td className="p-3 max-w-xs truncate">{review.comment || "-"}</td>
                      <td className="p-3 text-center">
                        <Badge variant={review.status === "APPROVED" ? "default" : review.status === "REJECTED" ? "destructive" : "secondary"}>
                          {review.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        {review.status === "PENDING" && (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" onClick={() => updateStatus(review.id, "APPROVED")} className="bg-green-600 hover:bg-green-700">
                              <CheckCircle className="w-4 h-4 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => updateStatus(review.id, "REJECTED")}>
                              <XCircle className="w-4 h-4 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                        {review.status !== "PENDING" && (
                          <span className="text-xs text-muted-foreground">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
