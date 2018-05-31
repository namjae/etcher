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

const path = require('path')

const React = require('react')
const propTypes = require('prop-types')
const styled = require('styled-components').default
const rendition = require('rendition')

const Breadcrumbs = require('./path-breadcrumbs')
const FileList = require('./file-list')
const RecentFiles = require('./recent-files')

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

const Header = Flex.extend`
  margin: 10px 15px 0;

  > * {
    margin: 5px;
  }
`

const Main = Flex.extend``

const Footer = Flex.extend`
  margin: 10px 20px;
  flex: 0 0 auto;

  > * {
    margin: 0 10px;
  }
`

class FileSelector extends React.PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      path: props.path,
      files: [],
    }
  }

  confirmSelection () {
    // TODO
    this.close()
  }

  close () {
    this.props.close()
  }

  componentDidUpdate () {
    console.log('FileSelector:componentDidUpdate')
  }

  navigate (newPath) {
    console.log('FileSelector:navigate', newPath)
    this.setState({ path: newPath })
  }

  navigateUp () {
    const newPath = path.join( this.state.path, '..' )
    console.log('FileSelector:navigateUp', this.state.path, '->', newPath)
    this.setState({ path: newPath })
  }

  selectFile (file) {
    console.log('FileSelector:selectFile', file)
  }

  // shouldComponentUpdate (nextProps, nextState) {
  //   console.log('FileSelector:shouldComponentUpdate', this.state, nextState)
  //   console.log('FileSelector:shouldComponentUpdate', this.state.files !== nextState.files)
  //   return this.state.files !== nextState.files
  // }

  render () {
    const styles = {
      display: 'flex',
      height: 'calc(100vh - 20px)',
    }
    return (
      <rendition.Provider style={ styles }>
        <RecentFiles flex="0 0 auto"
          selectFile={ ::this.selectFile }
          navigate={ ::this.navigate } />
        <Flex direction="column" grow="1">
          <Header flex="0 0 auto" alignItems="baseline">
            <rendition.Button
              bg={ colors.secondary.background }
              color={ colors.primary.color }
              onClick={ ::this.navigateUp }>
              <span className="fas fa-angle-left" />
              &nbsp;Back
            </rendition.Button>
            <span className="fas fa-hdd" />
            <Breadcrumbs
              path={ this.state.path }
              navigate={ ::this.navigate }
              constraints={ this.props.constraints }
            />
          </Header>
          <Main flex="1">
            <Flex direction="column" grow="1">
              <FileList path={ this.state.path }
                onNavigate={ ::this.navigate }
                onSelect={ ::this.selectFile }></FileList>
            </Flex>
          </Main>
          <Footer justifyContent="flex-end">
            <rendition.Button onClick={ ::this.close }>Cancel</rendition.Button>
            <rendition.Button
              primary
              onClick={ ::this.confirmSelection }>
              Select file
            </rendition.Button>
          </Footer>
        </Flex>
      </rendition.Provider>
    )
  }
}

FileSelector.propTypes = {
  path: propTypes.string,
  close: propTypes.func,
  constraints: propTypes.arrayOf(propTypes.string)
}

module.exports = FileSelector
