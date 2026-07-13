import { notFound } from "next/navigation";
import { MangaViewerLoader } from "@/components/viewer/MangaViewerLoader";
import { getAdByZone, getMangaById } from "@/lib/data";

interface MangaPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: MangaPageProps) {
  const { id } = await params;
  const manga = await getMangaById(id);
  return {
    title: manga?.title ?? "Reader",
    description: manga?.description ?? "Read manga online",
  };
}

export default async function MangaReaderPage({ params }: MangaPageProps) {
  const { id } = await params;
  const [manga, topAd, bottomAd, inlineAd] = await Promise.all([
    getMangaById(id),
    getAdByZone("viewer_top"),
    getAdByZone("viewer_bottom"),
    getAdByZone("viewer_inline"),
  ]);

  if (!manga) notFound();

  return (
    <MangaViewerLoader
      title={manga.title}
      pdfUrl={manga.pdf_file_url}
      topAd={topAd}
      bottomAd={bottomAd}
      inlineAd={inlineAd}
    />
  );
}
