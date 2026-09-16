import { Controller, Get, Query } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { SearchService } from './search.service';
import { SuggestionQueryDto } from './dto/suggestion-query-dto';

@Controller('api/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // Method           GET /api/search/suggestions
  // Description      Get the latest 3 users and 3 published blogs matching the search term
  // Anonymous: the header renders for signed-out visitors too.
  @Get('suggestions')
  @AllowAnonymous()
  getSuggestions(@Query() query: SuggestionQueryDto) {
    return this.searchService.getSuggestions(query);
  }
}
