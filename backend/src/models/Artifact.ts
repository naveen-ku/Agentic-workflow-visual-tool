/**
 * No assumptions about data shape
 * Artifact is a generic “thing being judged”
 *  */ 
export interface Artifact {
  artifactId: string
  label: string
  data: any
}
