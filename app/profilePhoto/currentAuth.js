let currentUser = null;

// AuthContext owns this value; avatar images use it to attach a fresh ID token.
export const setProfilePhotoAuthUser = user => { currentUser = user; };
export const getProfilePhotoAuthToken = () => currentUser?.getIdToken();
