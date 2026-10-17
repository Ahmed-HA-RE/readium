import { SuggestionQueryDto } from '../../search/dto/suggestion-query-dto';

// Same `q` validation as the public palette; only the service behind it differs.
export class AdminSuggestionsQueryDto extends SuggestionQueryDto {}
