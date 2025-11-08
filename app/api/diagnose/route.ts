import { NextRequest, NextResponse } from "next/server";
import { diagnose } from "@/lib/heuristics";
import { generateQuestions } from "@/lib/questions";

type DiagnoseRequest = {
  original: string;
  maxQuestions?: number;
};

export const POST = async (req: NextRequest) => {
  const body = (await req.json()) as DiagnoseRequest;
  const trimmed = body.original?.trim();

  if (!trimmed) {
    return NextResponse.json(
      { error: "Original prompt is required." },
      { status: 400 },
    );
  }

  const diagnosis = diagnose(trimmed);
  const questions = generateQuestions(diagnosis, body.maxQuestions ?? 4);

  return NextResponse.json({ diagnosis, questions });
};
