import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const app = initializeApp({
  credential: cert({
    projectId: "artist-boost",
    clientEmail: "firebase-adminsdk-fbsvc@artist-boost.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDYEEnqejo3lKqq\nnx6/7xwyyknCj85T1SVvdFavNs0sYZgY3oa5iM3gaT/bfRa32emSGSDo+nKzJRXJ\nz2vwEc6vQMczAFadia2Vcx+9dHls2fQJDGh+rJl4Mj4SBr+BenS9qfn1d7lh9Pwc\n/S8W/QI/spNEeUfAKGF34kjwla9JxNZkIKVK6fZIjF2NcpAIMsiHl37PQTdlmH+S\nTdLMm3elpgSKuJxOyTOlc3gw0cTiua6riuX6yuFRclccbyymyVx/7+TDS0/s7HT5\nz+koNXact6bYYBVOAJlLqwgfjzKQZLsBueaZz8vctPuppOxuaYrQK27T9jvODf06\nG0VuKcE9AgMBAAECggEAAd6KNSwfitGPdHBx/Kkd7laPss45s8H5U/CGu3dW6RZj\nEXwDYGGNnm5qrgR0CN0qxyfOgBWCnogomxlfTrFov11pG8jZ9vz08oEPej0iu81a\n7iUcVlQ5869DmDZUu9MKZYWt8vC5Ot66u6l5GdLQjSqHWaVO+Jug1D+x79rrrFCy\nkxUs+th6B1nBHUf6HtMvgvqy9pPeElJ5HIMmGOlEBu3yDMwSdLEo69RIGp7IWL95\nB6j7i5Daemqx67l4YA2byPUcSAbzoxjhvhVpbEhqdP0SBaIOhenaX/6easJz4Zuy\nFrRH7TBMw//ChoDS0dyeiYqLGRFP229zkSfS1zcQxQKBgQD3Dt78mVMd29yhLQOF\neNIWXZSS6bBHrnUF/lr3+ypXPHZXVVJtYjfRPk5+Cdij4jq+Ib82qBnJ3zXcqWa0\nbhT+mpDX1hxIzBVHvlSIVHYdnbSFvVfSx5VV0zJK5QxAO+cwYQyUuYG261OWBpEZ\nqTJNkaDBw8xzz9kpU4xLj4tUywKBgQDf4jyqCeB/GxAlj1kwH7gig1AnXqT182S/\nHYnU6+qblP5482zXcJREm+DUuNvL4WyHR2tsQOdAaSDI0h9zeF+O2pUfYDXzsRYB\n5271ghlQPC2QwoC9WKXUBOQClq0ZIal5SkYX30y/eX71i+S4ubrllL3bvkG+oCe7\nsnWxnL4JFwKBgCejkC1xID/TLdQCV+VLXFHQU+06Z1ko6Ye7prbQ6psyjT4351C7\niH8fAxL/221397rXyUkosXKNSKQN3fenDeFHxWOL69/WNrfbFs8E1iqsSfGHTpb4\nBMLPbutLUqrfsZk2iQE3vlMt8KxKg29dkT+W1PchxiTyvUH/MKxS7KT/AoGBANqU\n9meJRx6x3HzfTNN4VH2VuP8HH4Vlwbn56+TvBFosCJssBtr8djXZ/pORfD688wnM\nx+ukHmM7gJ+wzrYdEybU7/z3IRWwkmz/eMzH3VEBv/byf2DeGOE8eSSx2YSM4fqi\ncnbCNBtJUpQHpiJYa0nUg9z0Dxo/ISvXG6NyBfO3AoGAc+6ftfg2+aQqa+p04jwH\nq01l2amFB++4gNHxDXcqNInjpIJYR8fCOU6FqxhLTH2on5UgIpG6yEFndI9gumxs\nRijUYRM/FERtDUU+VfjL02xoB8dx1N+WmgzlaF+k3192+cvCkE9hFPOrVs1nf1Lg\nVN1Drd419BeCBBGrncg7C10=\n-----END PRIVATE KEY-----\n",
  })
});

export const db = getFirestore(app);
export const auth = getAuth(app);