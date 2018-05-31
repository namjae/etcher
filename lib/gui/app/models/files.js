/*
 * Copyright 2018 resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict'

const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const Bluebird = require('bluebird')
const async = require('async')

/* eslint-disable lodash/prefer-lodash-method */

const CONCURRENCY = 10

const collator = new Intl.Collator(undefined, {
  sensitivity: 'case'
})

function sortFiles(fileA, fileB) {
  return (fileB.isDirectory - fileA.isDirectory) ||
    collator.compare(fileA.basename, fileB.basename)
}

class FileEntry {
  constructor(filename, stats) {
    const components = path.parse(filename)

    this.path = filename
    this.dirname = components.dir
    this.basename = components.base
    this.name = components.name
    this.ext = components.ext
    this.isHidden = components.name.startsWith('.')
    this.isFile = stats.isFile()
    this.isDirectory = stats.isDirectory()
    this.isBlockDevice = stats.isBlockDevice()
    this.isCharacterDevice = stats.isCharacterDevice()
    this.stats = stats
  }
}

exports.readdir = function readdir(dirname, callback) {
  console.time('readdir')
  fs.readdir(dirname, (error, ls) => {
    if( error ) return callback(error)
    const files = ls.filter((filename) => {
      return !filename.startsWith('.')
    })
    .map((filename) => {
      return path.join(dirname, filename)
    })

    async.mapLimit(files, CONCURRENCY, (filename, next) => {
      return fs.stat(filename, (error, stats) => {
        if( error ) return next(error)
        next(null, new FileEntry(filename, stats))
      })
    }, (error, files) => {
      if (files) {
        files.sort(sortFiles)
      }
      console.timeEnd('readdir')
      callback(error, files)
    })
  })
}

// exports.readdirAsync = function readdirAsync(dirname) {
//   console.time('readdirAsync')
//   dirname = path.resolve(dirname)
//   return fs.readdirAsync(dirname).then((ls) => {
//     return ls.map((filename) => path.join(dirname, filename))
//   }).map((filename, index, length) => {
//     return fs.statAsync(filename).then((stats) => {
//       const components = path.parse(filename)
//       return new FileEntry(filename, stats)
//     })
//   }, { concurrency: CONCURRENCY }).then((files) => {
//     console.timeEnd('readdirAsync')
//     return files.sort(sortFiles)
//   })
// }

exports.readdirAsync = (dirname) => {
  return new Bluebird((resolve, reject) => {
    exports.readdir(dirname, (error, files) => {
      if (error) reject(error)
      else resolve(files)
    })
  })
}

/**
 * @summary Get file metadata for a list of filenames
 * @function
 * @public
 *
 * @description Note that this omits any file that errors
 *
 * @param {String} dirname - directory path
 * @param {Array<String>} basenames - file names
 * @returns {Promise<Array<Object>>} promise of file objects
 *
 * @example
 * files.getAllFilesMetadataAsync(os.homedir(), [ 'file1.txt', 'file2.txt' ])
 */
exports.getAllFilesMetadataAsync = (dirname, basenames) => {
  return Bluebird.reduce(basenames, (fileMetas, basename) => {
    return new Bluebird((resolve, reject) => {
      exports.getFileMetadataAsync(path.join(dirname, basename)).then((metadata) => {
        resolve(fileMetas.concat(metadata))
      }).catch(() => {
        resolve(fileMetas)
      })
    })
  }, [])
}

/**
 * @summary Split a path on it's separator(s)
 * @function
 * @public
 *
 * @param {String} fullpath - full path to split
 * @param {Array<String>} [subpaths] - this param shouldn't normally be used
 * @returns {Array<String>}
 *
 * @example
 * console.log(splitPath(path.join(os.homedir(), 'Downloads'))
 * // Linux
 * > [ '/', 'home', 'user', 'Downloads' ]
 * // Windows
 * > [ 'C:', 'Users', 'user', 'Downloads' ]
 */
exports.splitPath = (fullpath, subpaths = []) => {
  const {
    base,
    dir,
    root
  } = path.parse(fullpath)
  const isAbsolute = path.isAbsolute(fullpath)

  // Takes care of 'relative/path'
  if (!isAbsolute && dir === '') {
    return [ base ].concat(subpaths)

  // Takes care of '/'
  } else if (isAbsolute && base === '') {
    return [ root ].concat(subpaths)
  }

  return exports.splitPath(dir, [ base ].concat(subpaths))
}

/**
 * @summary Get all subpaths contained in a path
 * @function
 * @private
 *
 * @param {String} fullpath - path string
 * @returns {Array<Object>} - all subpaths as file objects
 *
 * @example
 * const subpaths = files.subpaths('/home/user/Downloads')
 * console.log(subpaths.map(file => file.fullpath))
 * // Linux/macOS
 * > [ '/', '/home', '/home/user', '/home/user/Downloads' ]
 * // Windows
 * > [ 'C:', 'Users', 'user', 'Downloads' ]
 */
exports.subpaths = (fullpath) => {
  if (!_.isString(fullpath)) {
    return null
  }

  return exports.splitPath(fullpath)

  // return _.map(dirs, (dir, index) => {
  //   // eslint-disable-next-line no-magic-numbers
  //   const subdir = dirs.slice(0, index + 1)
  //   return exports.getFileMetadataSync(path.join(...subdir))
  // })
}
