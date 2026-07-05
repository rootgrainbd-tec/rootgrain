"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

export function ProductReviews({ productId }: { productId: string }) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setReviews(data.filter(r => r.status === "APPROVED"));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return alert("Please login to submit a review.");
    if (!rating) return alert("Please select a rating.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Review submitted! It will appear once approved.");
        setComment("");
        setRating(5);
      } else {
        alert(data.error || "Failed to submit review.");
      }
    } catch (error) {
      alert("Error submitting review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-24 pt-12 border-t border-[var(--walnut-light)]/20">
      <h2 className="font-serif text-3xl text-[var(--walnut-dark)] mb-8">Customer Reviews</h2>
      
      <div className="grid lg:grid-cols-2 gap-12">
        {/* Review List */}
        <div>
          {loading ? (
            <p>Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
          ) : (
            <div className="space-y-6">
              {reviews.map(review => (
                <div key={review.id} className="pb-6 border-b border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-bold text-[var(--walnut-dark)]">{review.user?.name || "Anonymous"}</div>
                    <div className="flex text-[var(--gold)]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-current" : "text-gray-300"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[var(--walnut)] whitespace-pre-wrap">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Review Form */}
        <div>
          <div className="bg-white p-6 rounded-lg border border-[var(--walnut-light)]/20 shadow-sm">
            <h3 className="font-serif text-xl mb-4">Write a Review</h3>
            {!session ? (
              <p className="text-sm text-muted-foreground">Please <a href="/login" className="text-[var(--gold)] underline">log in</a> to leave a review.</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button 
                        key={star} 
                        type="button" 
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                      >
                        <Star className={`w-6 h-6 ${star <= rating ? "fill-[var(--gold)] text-[var(--gold)]" : "text-gray-300"}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Comment</label>
                  <Textarea 
                    rows={4} 
                    placeholder="What did you like or dislike?" 
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Submitting..." : "Submit Review"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
