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

const React = require('react')
const propTypes = require('prop-types')
const styled = require('styled-components').default
const rendition = require('rendition')

const prettyBytes = require('pretty-bytes')
const files = require('../../../models/files')
const middleEllipsis = require('../../../utils/middle-ellipsis')

/**
 * @summary Character limit of a filename before a middle-ellipsis is added
 * @constant
 * @private
 */
const FILENAME_CHAR_LIMIT = 20

/**
 * @summary Character limit of a filename before a middle-ellipsis is added
 * @constant
 * @private
 */
const FILENAME_CHAR_LIMIT_SHORT = 15

/**
 * @summary Color scheme
 * @constant
 * @private
 */
const colors = {
  primary: {
    color: '#3a3c41',
    background: '#ffffff',
    subColor: '#ababab'
  },
  secondary: {
    color: '#1c1d1e',
    background: '#ebeff4',
    title: '#b3b6b9'
  },
  highlight: {
    color: 'white',
    background: '#2297de'
  },
  soft: {
    color: '#4d5056'
  }
}

/**
 * @summary Flex styled component
 * @function
 * @type {ReactElement}
 */
const Flex = styled.div`
  display: flex;
  flex: ${ props => props.flex };
  flex-direction: ${ props => props.direction };
  justify-content: ${ props => props.justifyContent };
  align-items: ${ props => props.alignItems };
  flex-wrap: ${ props => props.wrap };
  flex-grow: ${ props => props.grow };
`

const ClickableFlex = styled.a`
  display: flex;
  flex: ${ props => props.flex };
  flex-direction: ${ props => props.direction };
  justify-content: ${ props => props.justifyContent };
  align-items: ${ props => props.alignItems };
  flex-wrap: ${ props => props.wrap };
  flex-grow: ${ props => props.grow };
`

class UnstyledFileListWrap extends React.PureComponent {
  constructor (props) {
    super(props)
    this.scrollElem = null
  }

  render () {
    return (
      <Flex className={ this.props.className }
        innerRef={ ::this.setScrollElem }
        wrap="wrap">
        { this.props.children }
      </Flex>
    )
  }

  setScrollElem (element) {
    this.scrollElem = element
  }

  componentDidUpdate (prevProps) {
    if (this.scrollElem) {
      this.scrollElem.scrollTop = 0
    }
  }

}

const FileListWrap = styled(UnstyledFileListWrap)`
  overflow-x: hidden;
  overflow-y: auto;
  padding: 0 20px;
`

class UnstyledFile extends React.PureComponent {

  static getFileIconClass (file) {
    if (file.isDirectory) {
      return 'fas fa-folder'
    }

    if (/^.(zip|rar|gz|tar|xz|bzip|bz|bz2|bzip2)$/i.test(file.ext)) {
      return 'fas fa-file-archive'
    }

    return 'fas fa-file-alt'
  }

  onHighlight (event) {
    event.preventDefault()
    this.props.onHighlight(this.props.file)
  }

  onSelect (event) {
    event.preventDefault()
    this.props.onSelect(this.props.file)
  }

  render () {
    const file = this.props.file
    return (
      <ClickableFlex
        data-path={ file.path }
        href={ `file://${file.path}` }
        direction="column"
        alignItems="stretch"
        className={ this.props.className }
        onClick={ ::this.onHighlight }
        onDoubleClick={ ::this.onSelect }>
        <span className={ UnstyledFile.getFileIconClass(file) } />
        <span>{ middleEllipsis(file.basename, FILENAME_CHAR_LIMIT_SHORT) }</span>
        <div>{ file.isDirectory ? '' : prettyBytes(file.stats.size || 0) }</div>
      </ClickableFlex>
    )
  }
}

const File = styled(UnstyledFile)`
  width: 100px;
  min-height: 100px;
  max-height: 128px;
  margin: 5px 10px;
  padding: 5px;
  background-color: none;
  transition: 0.05s background-color ease-out;
  color: ${ colors.primary.color };
  cursor: pointer;
  border-radius: 5px;
  word-break: break-word;

  :hover, :visited {
    color: ${ colors.primary.color };
  }

  :focus,
  :active {
    color: ${ colors.highlight.color };
    background-color: ${ colors.highlight.background };
  }

  :focus > span:first-of-type,
  :active > span:first-of-type {
    color: ${ colors.highlight.color };
  }

  :focus > div:last-child,
  :active > div:last-child {
    color: ${ colors.highlight.color };
  }

  > span:first-of-type {
    align-self: center;
    line-height: 1;
    margin-bottom: 6px;
    font-size: 48px;
    color: ${ props => props.disabled ? colors.primary.subColor : colors.soft.color };
  }

  > span:last-of-type {
    display: flex;
    justify-content: center;
    text-align: center;
    font-size: 14px;
  }

  > div:last-child {
    background-color: none;
    color: ${ colors.primary.subColor };
    text-align: center;
    font-size: 12px;
  }
`

class FileList extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      path: props.path,
      highlighted: null,
      files: [],
    }
  }

  readdir (dirname) {
    console.log('FileList:readdir', dirname)
    files.readdirAsync(dirname).then((files) => {
      window.requestAnimationFrame(() => {
        this.setState({ files: files })
      })
    })
  }

  componentDidMount () {
    process.nextTick(() => {
      this.readdir(this.state.path)
    })
  }

  onHighlight (file) {
    console.log('FileList:onHighlight', file)
    // this.setState({ highlighted: file.path })
  }

  onSelect (file) {
    console.log('FileList:onSelect', file.path, file.isDirectory)
    if (file.isDirectory) {
      this.props.onNavigate(file.path)
    } else {
      this.props.onSelect(file)
    }
  }

  componentDidUpdate () {
    console.timeEnd('FileList:componentDidUpdate')
  }

  shouldComponentUpdate (nextProps, nextState) {
    const shouldUpdate = (this.state.files !== nextState.files)
    console.log('FileList:shouldComponentUpdate', shouldUpdate)
    if (this.props.path !== nextProps.path) {
      this.readdir(nextProps.path)
    }
    if (shouldUpdate) {
      console.time('FileList:componentDidUpdate')
    }
    return shouldUpdate
  }

  static isSelectable (file) {
    return file.isDirectory || !file.ext ||
      /^.(img|bin|gz|bz|bz2|bzip2|bzip|dmg|iso|zip)$/i.test(file.ext)
  }

  render () {
    return (
      <FileListWrap wrap="wrap">
        {
          this.state.files.map((file) => {
            return (
              <File key={ file.path }
                file={ file }
                disabled={ !FileList.isSelectable(file) }
                onSelect={ ::this.onSelect }
                onHighlight={ ::this.onHighlight }/>
            )
          })
        }
      </FileListWrap>
    )
  }
}

FileList.propTypes = {
  path: propTypes.string,
  onNavigate: propTypes.func,
  onSelect: propTypes.func,
  constraints: propTypes.arrayOf(propTypes.string)
}

module.exports = FileList
