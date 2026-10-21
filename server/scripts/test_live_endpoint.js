import { query } from '../src/config/db.js';
import { getGoogleLiveReviews } from '../src/modules/reviews/googleLiveReviews.controller.js';

async function testController() {
  const wsId = '8e952305-0325-4456-a5fe-42dd84f3323b';
  const bizId = 'db2276f3-24f7-413d-a657-4559f36728f1';
  
  const req = {
    query: { businessId: bizId },
    workspaceId: wsId,
    user: { id: '6354abdc-4252-4e97-bba8-0ddb950d5ffc', role: 'client', workspace_id: wsId }
  };
  
  const res = {
    set: () => {},
    json: (payload) => {
      console.log('PAYLOAD SOURCE:', payload.source);
      console.log('PAYLOAD REVIEWS COUNT:', payload.reviews?.length);
      console.log('PAYLOAD RATING:', payload.rating);
      console.log('PAYLOAD USER RATINGS TOTAL:', payload.userRatingsTotal);
      process.exit(0);
    },
    status: (code) => {
      console.log('STATUS CODE:', code);
      return res;
    }
  };
  
  await getGoogleLiveReviews(req, res, console.error);
}

testController().catch(console.error);
