import React from 'react'
import { graphql, Link } from 'gatsby'
import './document.css'
import InternetArchive from '../images/internet-archive.jpg'

import Layout from '../components/layout'

const miradorConfig = {
  id: 'mirador-viewer',
  window: {
    allowClose: false,
    allowMaximize: false,
    defaultSideBarPanel: 'info',
    defaultView: 'single',
  },
  thumbnailNavigation: {
    defaultPosition: 'off',
  },
  workspace: {
    type: 'single',
  },
  workspaceControlPanel: {
    enabled: false,
  }
}

export const query = graphql`
  query($iaId: String!) {
    documentsJson(iaId: { eq: $iaId }) {
      id
      iaId
      box
      folder
      title
      description
      date
      subject {
        id
        name
      }
      contributor {
        id
        name
      }
      creator {
        id
        name
      }
    }
    allFindingAidJson {
      nodes {
        title
        boxes {
          folders {
            iaId
            digitized
            description
            number
            title
            items {
              iaId
              description
              title
            }
          }
        }
      }
    }
  }
`

class Mirador extends React.Component {

  componentDidMount() {
    const {config, plugins} = this.props
    let mirador = require('mirador').default
    mirador.viewer(config, plugins)
  }

  render() {
    const { config } = this.props
    return <div id={config.id} />
  }

}

const Document = ({ data }) => {

  const doc = data.documentsJson
  if (doc.contributor === null) {
    doc.contributor = []
  }
  const contributors = doc.contributor.map(c => (
    <div><Link to={`/search/?f=contributor:${c.name}`}>{c.name}</Link></div>
  ))

  if (doc.subject === null) {
    doc.subject = []
  }
  const subjects = doc.subject.map(c => (
    <div><Link key={`subject-link-${c.name}`} to={`/search/?f=subject:${c.name}`}>{c.name}</Link></div>
  ))

  const manifestUrl = `https://iiif.archivelab.org/iiif/${doc.iaId}/manifest.json`

  let canvasIndex = 0
  if (typeof window !== 'undefined' && window.location.hash) {
    canvasIndex = Number.parseInt(window.location.hash.replace('#', '')) - 1
  }

  const [folder, items] = getFolderOrItems(doc.iaId, data.allFindingAidJson.nodes)
  let browseLinks = ''
  if (items.length > 0) {
    browseLinks = (
      <>
        <dt className="label">Items in this Folder</dt>
        {items.map(i => (
          <dd key={`item-link-${i.iaId}`}><Link to={`/document/${i.iaId}/`}>{i.title}</Link></dd>
        ))}
      </>
    )
  } else if (folder) {
    browseLinks = (
      <>
        <dt className="label">Folder for this Item</dt>
        <dd><Link to={`/document/${folder.iaId}/`}>{folder.title}</Link></dd>
      </>
    )
  }

  miradorConfig.windows = [
    {
      loadedManifest: manifestUrl,
      view: 'single',
      canvasIndex: canvasIndex
    }
  ]

  return (
    <Layout>
      <div id="document">
        <section className="leader">
          <article>
            <h1>{doc.title}</h1>
          </article>
        </section>
        <section className="columns">
          <article className="metadata col-6 col-12-sm col-12-xs">
            <dl>
              <dt className="label">Description</dt>
              <dd>{doc.description}</dd>
              <dt className="label">Subject(s)</dt>
              <dd>{subjects}</dd>
              <dt className="label">Contributors</dt>
              <dd>{contributors}</dd>
              {browseLinks}
            </dl>
          </article>
          <article id="doc-viewer" className="col-6 col-12-sm col-12-xs">
            <Mirador config={miradorConfig} plugins={[]} />
            <div className="internet-archive">
              <a href={`https://archive.org/details/${doc.iaId}`}>
                <img alt="View at Internet Archive" title="View this document at the Internet Archive" src={InternetArchive} />
              </a>
            </div>
          </article>
        </section>
      </div>
    </Layout>
 
  )
}

/**
 * Returns the folder for an item or the items in a folder. 
 * @param {*} iaId - for a folder or item
 * @param {*} findingAid - the finding aid data
 */
function getFolderOrItems(iaId, findingAid) {
  let itemFolder = null
  const folderItems = []
  for (const series of findingAid) {
    for (const box of series.boxes) {
      for (const folder of box.folders) {
        for (const item of folder.items) {
          if (folder.iaId === iaId) {
            folderItems.push(item)
          } else if (item.iaId === iaId && folder.digitized) {
            itemFolder = folder
          }
        }
      }
    }
  }
  return [itemFolder, folderItems]
}

export default Document