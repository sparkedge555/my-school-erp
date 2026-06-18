/* ==========================================================================
   auth-guard.js
   School ERP — Role-based auth guards (Firebase v9 compat / CDN script-tag)
   --------------------------------------------------------------------------
   Load order on protected pages:
     1. firebase compat CDN scripts
     2. assets/firebase-config.js
     3. assets/auth-guard.js
     4. page-specific script that calls checkAdminAuth() / checkTeacherAuth()
        / checkStudentAuth()

   All functions are attached to window (no ES modules) so they work
   directly via <script> tags on GitHub Pages.
   ========================================================================== */

(function () {
  'use strict';

  const LOGIN_REDIRECT = '/my-school-erp/index.html';

  /**
   * Internal helper: resolves once Firebase reports an auth state,
   * verifies the user's Firestore role, and redirects to login if
   * anything doesn't check out.
   * @param {string} requiredRole - 'admin' | 'teacher' | 'student'
   * @returns {Promise<Object>} resolves with the merged current-user object
   */
  function guardByRole(requiredRole) {
    return new Promise((resolve) => {
      firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
          window.location.href = LOGIN_REDIRECT;
          return;
        }

        let doc;
        try {
          doc = await firebase.firestore().collection('users').doc(user.uid).get();
        } catch (e) {
          console.log('Auth guard error fetching user doc:', e);
          window.location.href = LOGIN_REDIRECT;
          return;
        }

        if (!doc.exists || doc.data().role !== requiredRole) {
          window.location.href = LOGIN_REDIRECT;
          return;
        }

        window.currentUser = { uid: user.uid, email: user.email, ...doc.data() };
        resolve(window.currentUser);
      });
    });
  }

  // ------------------------------------------------------------------------
  // Role-specific guards
  // ------------------------------------------------------------------------
  window.checkAdminAuth = async function () {
    return guardByRole('admin');
  };

  window.checkTeacherAuth = async function () {
    return guardByRole('teacher');
  };

  window.checkStudentAuth = async function () {
    return guardByRole('student');
  };

  // ------------------------------------------------------------------------
  // Logout
  // ------------------------------------------------------------------------
  window.logoutUser = async function () {
    try {
      await firebase.auth().signOut();
    } finally {
      window.location.href = LOGIN_REDIRECT;
    }
  };

  // ------------------------------------------------------------------------
  // Activity logging
  // ------------------------------------------------------------------------
  window.logActivity = async function (action) {
    try {
      await firebase.firestore().collection('activity_log').add({
        action: action,
        by: window.currentUser ? window.currentUser.name : 'System',
        uid: window.currentUser ? window.currentUser.uid : '',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (e) {
      console.log('Log error:', e);
    }
  };
})();