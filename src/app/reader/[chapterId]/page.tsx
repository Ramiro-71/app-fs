import { ReaderClient } from "@/app/reader/[chapterId]/reader-client";

type ReaderPageProps = {
  params: Promise<{ chapterId: string }>;
};

export default async function ReaderPage({ params }: ReaderPageProps) {
  const { chapterId } = await params;

  return <ReaderClient chapterId={chapterId} />;
}