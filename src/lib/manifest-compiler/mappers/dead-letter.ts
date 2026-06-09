import type { DeadLetterPolicy } from '@/types/ontology';
import type { ManifestDeadLetterPolicy } from '@/lib/manifest-validator';

export function mapDeadLetterPolicies(
  policies: DeadLetterPolicy[],
): ManifestDeadLetterPolicy[] {
  return policies.map((policy): ManifestDeadLetterPolicy => ({
    id: policy.id,
    name: policy.name,
    nameEn: policy.nameEn,
    maxRetries: policy.maxRetries,
    queue: policy.queue,
    onExhausted: policy.onExhausted,
    description: policy.description,
  }));
}
