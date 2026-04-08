<?php

/**
 * Vercel requires serverless functions to live inside the root `api/`
 * directory. This thin wrapper delegates to the actual Laravel entry point
 * in backend/api/index.php. Because PHP resolves __DIR__ relative to each
 * file's own location, all paths inside the backend entry point remain correct.
 */

require __DIR__ . '/../backend/api/index.php';
