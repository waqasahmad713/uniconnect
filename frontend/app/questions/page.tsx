import Link from "next/link";
import { PostStream } from "@/components/PostStream";

export default function QuestionsPage() {
  return (
    <PostStream
      eyebrow="CS Q&A"
      title="Ask the CS community"
      subtitle="Questions for Computer Science graduates, students, and professionals."
      query="post_type=question"
      defaultType="question"
      typeOptions={["question"]}
      titlePlaceholder="What do you want to ask?"
      bodyPlaceholder="Add context: what you tried, your background, or the problem you are stuck on."
      submitLabel="Post question"
      emptyText="No questions yet. Ask the first one."
      sharePath="/questions"
      allowCompose
      aside={
        <>
          <div className="rounded-2xl border border-[#7eb6d0] bg-[#e7f4fa] p-5 text-sm leading-7 text-[#1d5f7a]">
            Open a question, then use comments as answers. Like a useful answer so others can find it.
          </div>
          <Link href="/community" className="block rounded-2xl border border-line bg-card p-5">
            <p className="font-display text-xl">Go to Feed</p>
            <p className="mt-2 text-sm text-ink-soft">
              Ideas, discussions, and resources stay on the feed.
            </p>
          </Link>
        </>
      }
    />
  );
}
