import { Suspense } from "react";
import InterviewClient from "./InterviewClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InterviewClient />
    </Suspense>
  );
}
