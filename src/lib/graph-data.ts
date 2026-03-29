import { getCollection } from 'astro:content';

export interface GraphNode {
  id: string;
  title: string;
  slug: string;
  tags: string[];
  linkCount: number;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export async function getGraphData(): Promise<GraphData> {
  const notes = await getCollection('notes');
  const publicNotes = notes.filter(n => n.data.public && !n.data.draft);

  const titleToSlug = new Map<string, string>();
  for (const note of publicNotes) {
    titleToSlug.set(note.data.title.toLowerCase(), note.id);
  }

  const edges: GraphEdge[] = [];
  const linkCounts = new Map<string, number>();

  for (const note of publicNotes) {
    const body = note.body || '';
    const regex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
    let match;

    while ((match = regex.exec(body)) !== null) {
      const targetTitle = match[1].toLowerCase();
      const targetSlug = titleToSlug.get(targetTitle);
      if (targetSlug && targetSlug !== note.id) {
        edges.push({ source: note.id, target: targetSlug });
        linkCounts.set(note.id, (linkCounts.get(note.id) || 0) + 1);
        linkCounts.set(targetSlug, (linkCounts.get(targetSlug) || 0) + 1);
      }
    }
  }

  const nodes: GraphNode[] = publicNotes.map(note => ({
    id: note.id,
    title: note.data.title,
    slug: note.id,
    tags: note.data.tags,
    linkCount: linkCounts.get(note.id) || 0,
  }));

  return { nodes, edges };
}
