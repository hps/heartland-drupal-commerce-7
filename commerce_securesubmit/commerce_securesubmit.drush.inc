<?php

/**
 * @file
 * Drush integration for the Commerce SecureSubmit module.
 */

/**
 * Implements hook_drush_command().
 */
function commerce_securesubmit_drush_command() {
  $items['securesubmit-download'] = array(
    'description' => dt('Please download the SecureSubmit PHP SDK from https://github.com/hps/heartland-php'),
  );
  return $items;
}

/**
 * A command callback.
 */
function drush_commerce_securesubmit_download() {
  $path = drush_get_context('DRUSH_DRUPAL_ROOT');
  if (module_exists('libraries')) {
    $path .= '/' . libraries_get_path('hps');
  }

  if (is_dir($path)) {
    drush_log('SecureSubmit PHP SDK already present. No download required.', 'ok');
  }
  elseif (drush_shell_exec('git clone https://github.com/hps/heartland-php.git ' . $path)) {
    drush_log(dt('SecureSubmit PHP SDK has been cloned via git to @path.', array('@path' => $path)), 'success');
  }
  else {
    drush_log(dt('Drush was unable to clone the SecureSubmit SDK to @path.', array('@path' => $path)), 'warning');
  }
}

/**
 * Implements drush_MODULE_post_COMMAND().
 */
function drush_commerce_securesubmit_post_pm_enable() {
  $extensions = func_get_args();

  if (strpos($extensions[0], ',') !== FALSE) {
    $extensions = explode(',', $extensions[0]);
  }

  if (in_array('commerce_securesubmit', $extensions) && !drush_get_option('skip')) {
    drush_commerce_securesubmit_download();
  }
}
