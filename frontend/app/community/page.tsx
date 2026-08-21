import Link from "next/link";
import { PostStream } from "@/components/PostStream";

export default function FeedPage() {
  return (
    <PostStream
      eyebrow="CS feed"
      title="What the community is sharing"
      subtitle="Ideas, discussions, and resources from CS graduates. Stay, read, and join the thread."
      query="exclude_type=question"
      defaultType="idea"
      typeOptions={["idea", "discussion", "resource", "job", "internship", "collaboration"]}
      filters={["all", "idea", "discussion", "resource"]}
      titlePlaceholder="Title"
      bodyPlaceholder="Share an idea, discussion, or resource. No videos."
      submitLabel="Publish to feed"
      emptyText="The feed is waiting for the next idea. Meanwhile, ask a question or browse opportunities."
      sharePath="/community"
      aside={
        <>
          <div className="rounded-2xl border border-line bg-card p-5 text-sm leading-7 text-ink-soft">
            Browse ideas, discussions, and resources from CS graduates. Like and comment. For homework help, use Questions.
          </div>
          <Link href="/questions" className="block rounded-2xl border border-[#7eb6d0] bg-[#e7f4fa] p-5">
            <p className="font-display text-xl text-[#1d5f7a]">Ask a question</p>
            <p className="mt-2 text-sm text-[#1d5f7a]">
              Homework, projects, careers — questions go here, not in the feed.
            </p>
          </Link>
          <Link href="/opportunities" className="block rounded-2xl border border-line bg-card p-5">
            <p className="font-display text-xl">Opportunities</p>
            <p className="mt-2 text-sm text-ink-soft">
              Internships and jobs for CS. Open one, then share it with the class.
            </p>
          </Link>
        </>
      }
    />
  );
}
