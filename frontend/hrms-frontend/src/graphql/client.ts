import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

/**
 * Apollo Client Setup
 * This connects your React frontend to the Express/GraphQL backend.
 */

const httpLink = createHttpLink({
  uri: 'http://localhost:5000/graphql',
});

const authLink = setContext((_, { headers }) => {
  // Get the token and institution ID from localStorage
  const token = localStorage.getItem('token');
  const institutionId = localStorage.getItem('institution_id') || 'COLLEGE_A';
  
  return {
    headers: {
      ...headers,
      'x-institution-id': institutionId,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
