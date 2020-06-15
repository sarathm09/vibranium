import React from 'react'
import { MDXProvider } from '@mdx-js/react'

import createMuiTheme from '@material-ui/core/styles/createMuiTheme'
import EmojiObjectsIcon from '@material-ui/icons/EmojiObjects'
import makeStyles from '@material-ui/core/styles/makeStyles'
import CssBaseline from '@material-ui/core/CssBaseline'
import Typography from '@material-ui/core/Typography'
import IconButton from '@material-ui/core/IconButton'
import Container from '@material-ui/core/Container'
import GitHubIcon from '@material-ui/icons/GitHub'
import { ThemeProvider } from '@material-ui/core'
import Toolbar from '@material-ui/core/Toolbar'
import { grey, orange } from '@material-ui/core/colors'
import GetApp from '@material-ui/icons/GetApp'
import AppBar from '@material-ui/core/AppBar'
import Drawer from '@material-ui/core/Drawer'
import Hidden from '@material-ui/core/Hidden'
import MenuIcon from '@material-ui/icons/Menu'
import Grid from '@material-ui/core/Grid'

import Paper from '@material-ui/core/Paper'
import SearchBox from './SearchBox'
import PageTree from './PageTree'
import Logo from './Logo'
import './layout.css'
import hljs from 'highlight.js'
import 'highlight.js/styles/vs.css'
import vcUI from '../images/vc_ui.png'

const drawerWidth = 270
const getHtmlLink = props => {
	let href = props.href
	let children = props.children
	let navLink = false

	if (!!href && !href.startsWith('http')) {
		if (!!href && href.includes('/')) {
			if (!href.startsWith('/') && ['cli', 'docs', 'setup'].includes(href.split('/')[1])) href = `/${href}`
		}
		if (!!href && !href.startsWith('/')) href = `/${href}`
		else href = '/vibranium/'
	}

	href = href.replace('.md', '').replace('pages/', '')
	if (!!props.children && typeof props.children === 'string' && props.children === 'Next') {
		children = 'Next »'
		href = '/vibranium/setup' + href
		navLink = true
	} else if (!!props.children && typeof props.children === 'string' && props.children === 'Previous') {
		children = '« Previous'
		href = '/vibranium/setup' + href
		navLink = true
	}
	if (!!href && !href.startsWith('http') && href.startsWith('/') && !href.includes('vibranium')) href = `/vibranium${href}`

	return (
		<a style={navLink ? { float: props.children === 'Next' ? 'right' : 'left', textDecoration: 'none' } : { textDecoration: 'none' }} href={href}>
			{children}
		</a>
	)
}

const mdxTagMap = {
	mdxTagMap: classes => ({
		h1: props => <Typography className={classes.h1} {...props} variant="h1" component="h1" />,
		h2: props => <Typography className={classes.h2} {...props} variant="h2" component="h2" />,
		h3: props => <Typography className={classes.h3} {...props} variant="h3" component="h3" />,
		h4: props => <Typography className={classes.h4} {...props} variant="h4" component="h4" />,
		h5: props => <Typography className={classes.h5} {...props} variant="h5" component="h5" />,

		pre: props => <pre className={classes.pre} {...props} />,
		code: props => <code dangerouslySetInnerHTML={{ __html: hljs.highlightAuto(props.children).value }} />,
		a: props => getHtmlLink(props),
		img: props => (
			<Paper elevation={3} spacing={1} style={{ margin: '1rem' }}>
				<img {...props} src={vcUI} style={{ display: 'block', margin: 'auto' }} alt={'Report UI'}></img>
			</Paper>
		),

		blockquote: props => (
			<Paper elevation={3} spacing={1} style={{ margin: '1rem' }}>
				<Grid container style={{ display: 'flex', padding: '0.5rem 1.5rem 0.5rem 0.5rem' }} alignItems="center">
					<Grid item md={1} sm={false} style={{ padding: 'auto', textAlign: 'center', verticalAlign: 'middle' }}>
						<EmojiObjectsIcon style={{ color: orange[500] }} fontSize="large" />
					</Grid>
					<Grid item md={11} sm={12} {...props} />
				</Grid>
			</Paper>
		),

		// Or define component inline
		p: props => <Typography {...props} className={classes.paragraph} variant="body1" component="p" />,
	}),
	mdxTagClasses: {
		h1: {
			fontSize: '4rem',
			marginTop: '3rem',
			marginBottom: '2rem',
		},
		h2: {
			fontSize: '3rem',
			marginTop: '2rem',
			marginBottom: '1rem',
		},
		h3: {
			fontSize: '2rem',
			marginTop: '2rem',
			marginBottom: '1rem',
		},
		h4: {
			fontSize: '1rem',
			marginTop: '1rem',
		},
		h5: {
			fontSize: '0.5rem',
			marginTop: '1rem',
		},
		pre: {
			border: `solid 1px ${grey[200]}`,
			boxShadow: `inset 3px 3px 3px ${grey[400]}, inset -3px -3px 3px ${grey[100]}`,
			borderRadius: '0.3rem',
		},
		paragraph: {
			marginTop: '1.5rem !important',
			marginBottom: '1.5rem !important',
		},
	},
}

const useStyles = makeStyles(theme => ({
	container: {
		marginTop: '20px',
		marginBottom: '5rem',
		paddingBottom: 20,
	},
	menuButton: {
		marginRight: theme.spacing(2),
// 		[theme.breakpoints.up('xl')]: {
// 			display: 'none',
// 		},
	},
	drawer: {
		[theme.breakpoints.up('xl')]: {
			width: drawerWidth,
			flexShrink: 0,
		},
	},
	appBar: {
		zIndex: theme.zIndex.drawer + 1,
		boxShadow: `0px 7px 9px #212121db`,
		backgroundColor: grey[900],
	},
	toolbar: theme.mixins.toolbar,
	drawerPaper: {
		width: drawerWidth,
		backgroundColor: grey[800],
		color: '#fff',
	},
	content: {
		flexGrow: 1,
		padding: theme.spacing(3),
	},
	navBarIconLinks: {
		color: grey[300],
		float: 'right',
		textDecoration: 'none',
		marginTop: '10px',
		marginRight: '1rem',
	},
	...mdxTagMap.mdxTagClasses,
}))

const container = typeof window !== undefined ? () => window.document.body : undefined

export default function Layout({ children, location }) {
	const classes = useStyles()
	const theme = createMuiTheme({
		palette: {
			// type: 'dark'
		},
	})

	const [mobileOpen, setMobileOpen] = React.useState(false)

	const handleDrawerToggle = () => {
		setMobileOpen(!mobileOpen)
	}

	const drawer = (
		<div>
			<div className={classes.toolbar} />
			<PageTree location={location} />
		</div>
	)

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<MDXProvider components={mdxTagMap.mdxTagMap(classes)}>
				<AppBar className={classes.appBar}>
					<Toolbar>
						<IconButton color="inherit" aria-label="open drawer" edge="start" onClick={handleDrawerToggle} className={classes.menuButton}>
							<MenuIcon />
						</IconButton>

						<Logo style={{ height: '25px', width: '25px', marginRight: '1rem' }} />
						<a href="/vibranium" style={{ color: 'white', textDecoration: 'none' }}>
							<Typography variant="h6">Vibranium documentation</Typography>
						</a>

						<SearchBox />

						<a href="https://www.npmjs.com/package/vibranium-cli" className={classes.navBarIconLinks}>
							<GetApp />
						</a>
						<a href="https://github.com/sarathm09/vibranium" className={classes.navBarIconLinks}>
							<GitHubIcon />
						</a>
					</Toolbar>
				</AppBar>

				<nav className={classes.drawer} aria-label="pages" style={{ backgroundColor: grey[800], color: '#fff' }}>
					<Hidden xlUp implementation="css">
						<Drawer
							container={container}
							variant="temporary"
							anchor={theme.direction === 'rtl' ? 'right' : 'left'}
							open={mobileOpen}
							onClose={handleDrawerToggle}
							classes={{ paper: classes.drawerPaper }}
							ModalProps={{ keepMounted: true }}
						>
							{drawer}
						</Drawer>
					</Hidden>
					<Hidden xlDown implementation="css">
						<Drawer classes={{ paper: classes.drawerPaper }} variant="permanent" open>
							{drawer}
						</Drawer>
					</Hidden>
				</nav>

				<Toolbar />
				<Container maxWidth="lg" className={classes.container}>
					{children}
				</Container>
			</MDXProvider>
		</ThemeProvider>
	)
}
