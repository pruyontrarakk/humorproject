import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", details: authError?.message },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { caption_id, rating } = body;

    if (!caption_id || rating === undefined) {
      return NextResponse.json(
        { error: "Missing caption_id or rating" },
        { status: 400 }
      );
    }

    if (rating !== 1 && rating !== -1) {
      return NextResponse.json(
        { error: "Rating must be 1 or -1" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const row = {
      profile_id: user.id,
      caption_id,
      vote_value: rating,
      created_datetime_utc: now,
      modified_datetime_utc: now,
    };

    // Insert new vote (created_datetime_utc required by DB). If row exists, update instead.
    const { data: insertData, error: insertError } = await supabase
      .from("caption_votes")
      .insert(row)
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        // Unique violation: row exists, update it (do not overwrite created_datetime_utc)
        const { data: updateData, error: updateError } = await supabase
          .from("caption_votes")
          .update({
            vote_value: rating,
            modified_datetime_utc: now,
          })
          .eq("profile_id", user.id)
          .eq("caption_id", caption_id)
          .select()
          .single();

        if (updateError) {
          console.error("Error updating vote:", updateError);
          return NextResponse.json(
            { error: "Failed to save vote", details: updateError.message },
            { status: 500 }
          );
        }
        return NextResponse.json({ rating: updateData?.vote_value });
      }
      console.error("Error saving vote:", insertError);
      return NextResponse.json(
        { error: "Failed to save vote", details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ rating: insertData?.vote_value });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", details: authError?.message },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const caption_id = body?.caption_id;

    if (!caption_id) {
      return NextResponse.json(
        { error: "Missing caption_id" },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from("caption_votes")
      .delete()
      .eq("profile_id", user.id)
      .eq("caption_id", caption_id);

    if (deleteError) {
      console.error("Error deleting vote:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove vote", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
