module.exports = {
  pathPrefix: "/vibranium",
  siteMetadata: {
    title: 'Vibranium Documentation',
    description: 'Vibranium is a CLI based API testing and data generation tool built on Node JS. ',
    author: '@sarathm09',
    url: 'https://sarathm09.github.io/vibranium',
    twitterUsername: 'sarathm09'
  },
  plugins: [
    'gatsby-plugin-react-helmet',
    'gatsby-theme-material-ui',
    'gatsby-transformer-sharp',
    'gatsby-plugin-sharp',
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'images',
        path: `${__dirname}/src/images`,
      },
    },
    {
      resolve: 'gatsby-plugin-manifest',
      options: {
        name: 'gatsby-starter-default',
        short_name: 'vibranium',
        start_url: '/',
        background_color: '#663399',
        theme_color: '#663399',
        display: 'minimal-ui',
        icon: `${__dirname}/src/images/vib_icon.png`
      },
    },
    // 'gatsby-plugin-offline',
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'pages',
        path: `${__dirname}/src/pages`
      },
    },
    {
      resolve: 'gatsby-plugin-mdx',
      options: {
        defaultLayouts: {
          default: require.resolve('./src/components/Layout.jsx'),
        },
        gatsbyRemarkPlugins: [`gatsby-remark-autolink-headers`],
      }
    }
  ],
}
