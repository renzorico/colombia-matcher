import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

export interface Question {
  id: string;
  /** Backend axis name (e.g. "energy_environment"). Use axisToTopic() to convert to QuizTopic. */
  axis: string;
  bucket: string;
  statement: string;
  weight: number;
}

export interface Result {
  candidate: string;
  score: number;
  breakdown: Record<string, number>;
}

interface AffinityResponse {
  results: Result[];
}

interface ExplainResponse {
  candidate: string;
  explanation: string;
}

export async function getQuestions(): Promise<Question[]> {
  const { data } = await api.get<Question[]>("/questions");
  return data;
}

export async function submitQuiz(
  answers: Record<string, number>
): Promise<Result[]> {
  const { data } = await api.post<AffinityResponse>("/quiz/submit", {
    answers,
  });
  return data.results;
}

export async function explainCandidate(
  name: string,
  answers: Record<string, number>
): Promise<string> {
  const { data } = await api.get<ExplainResponse>(
    `/explain/${encodeURIComponent(name)}`,
    { params: { answers: JSON.stringify(answers) } }
  );
  return data.explanation;
}
