/* ==========================================================================
   firebase-config.js
   School ERP — Firebase (v9 compat / CDN script-tag mode) + Cloudinary
   --------------------------------------------------------------------------
   This file must be loaded AFTER the Firebase compat CDN scripts:
     <script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-app-compat.js"></script>
     <script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-auth-compat.js"></script>
     <script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-firestore-compat.js"></script>
     <script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-database-compat.js"></script>
   And BEFORE any page script that uses window.db / window.auth / window.rtdb
   or window.uploadToCloudinary / window.showToast.

   No Firebase Storage is used anywhere in this project. All file/image
   uploads go through Cloudinary via window.uploadToCloudinary().
   ========================================================================== */

(function () {
  'use strict';

  // ------------------------------------------------------------------------
  // 1. Firebase config & initialization
  // ------------------------------------------------------------------------
  const firebaseConfig = {
    apiKey: 'AIzaSyBeOWntOYE-E-nKBdEpgT3i2CgMTkoh4as',
    authDomain: 'my-school-erp-d15d2.firebaseapp.com',
    databaseURL: 'https://my-school-erp-d15d2-default-rtdb.firebaseio.com',
    projectId: 'my-school-erp-d15d2',
    storageBucket: 'my-school-erp-d15d2.firebasestorage.app',
    messagingSenderId: '602190023012',
    appId: '1:602190023012:web:ef515b74e0483990e81271'
  };

  // Avoid re-initializing if this script is accidentally included twice
  if (!firebase.apps || !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  // Expose Firebase service handles globally for every page to use
  window.db = firebase.firestore();
  window.auth = firebase.auth();
  window.rtdb = firebase.database();

  // ------------------------------------------------------------------------
  // 2. Cloudinary globals (NO Firebase Storage used anywhere)
  // ------------------------------------------------------------------------
  window.CLOUDINARY_CLOUD = 'dmx5bsdhi';
  window.CLOUDINARY_PRESET = 'school_erp_uploads';

  /**
   * Upload a file to Cloudinary using an unsigned upload preset.
   * @param {File} file - The file/image to upload.
   * @param {string} folder - Cloudinary folder to store the asset in.
   * @returns {Promise<string>} The secure_url of the uploaded asset.
   */
 window.uploadToCloudinary = async function (file, folder) {
  if (!file) throw new Error('No file provided');

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File too large. Maximum size is 5MB.');
  }

  const url = `https://api.cloudinary.com/v1_1/${window.CLOUDINARY_CLOUD}/auto/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', window.CLOUDINARY_PRESET);
  if (folder) formData.append('folder', folder);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData
      // DO NOT set Content-Type header — browser sets it with boundary automatically
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Cloudinary error response:', errBody);
      throw new Error(`Upload failed (${response.status}). Check your upload preset is set to "Unsigned" in Cloudinary dashboard.`);
    }

    const data = await response.json();
    if (!data.secure_url) throw new Error('No URL returned from Cloudinary');
    return data.secure_url;

  } catch (networkErr) {
    if (networkErr.message.includes('Failed to fetch')) {
      throw new Error('Network error uploading image. Check internet connection.');
    }
    throw networkErr;
  }
};

  // ------------------------------------------------------------------------
  // 3. Toast notifications
  // ------------------------------------------------------------------------
  /**
   * Show a toast notification.
   * @param {string} message - The text to display.
   * @param {'success'|'error'|'warning'|'info'} type - Toast style/type.
   */
  window.showToast = function (message, type) {
    const validTypes = ['success', 'error', 'warning', 'info'];
    const toastType = validTypes.includes(type) ? type : 'info';

    // Ensure the toast container exists (created lazily if not already in DOM)
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${toastType}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[toastType]}</span>
      <span class="toast-message"></span>
    `;
    // Set message via textContent to avoid HTML injection from dynamic strings
    toast.querySelector('.toast-message').textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  };
})();