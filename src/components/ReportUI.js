import React from "react"
import { useStaticQuery, graphql } from "gatsby"
import Img from "gatsby-image"


const ReportUI = ({ props }) => {
  const data = useStaticQuery(graphql`
    query {
      placeholderImage: file(relativePath: { eq: "vc_ui.png" }) {
        childImageSharp {
          fluid(maxWidth: 1900) {
            ...GatsbyImageSharpFluid
          }
        }
      }
    }
  `)

  return <Img fluid={data.placeholderImage.childImageSharp.fluid} {...props} />
}

export default ReportUI
