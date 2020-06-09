import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import DoubleArrowIcon from '@material-ui/icons/DoubleArrow'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import FolderOpen from '@material-ui/icons/FolderOpen'
import Typography from '@material-ui/core/Typography'
import { grey, red } from '@material-ui/core/colors'
import React, { useState, useEffect } from 'react'
import ListItem from '@material-ui/core/ListItem'
import { useStaticQuery, graphql } from 'gatsby'
import Divider from '@material-ui/core/Divider'
import { makeStyles } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'
import List from '@material-ui/core/List'

const getParsedResult = result =>
	result.map(r => ({
		title: r.frontmatter.title,
		slug: r.frontmatter.slug,
		author: r.frontmatter.author,
	}))
const useStyles = makeStyles(theme => ({
	listItem: {
		color: theme.palette.text,
		textDecoration: 'none',
		display: 'flex',
		alignItems: 'center',
		width: 'max-content',
	},
	iconText: { display: 'flex', alignItems: 'center' },
	panelHeader: {
		backgroundColor: grey[800],
		color: '#fff',
	},
	panelBody: {
		padding: '0px 5px',
	},
}))

const getLocationPathName = location => {
	if (!location || !location.pathname) return ''
	if (!!location && location.pathname && location.pathname.endsWith('/') && location.pathname.length > 2)
		return location.pathname.slice(0, location.pathname.length - 1)
	return location && location.pathname
}

const getLinkText = (p, location, classes) => {
	return (
		<Typography
			variant="subtitle2"
			style={{ color: getLocationPathName(location) === p.slug ? red[300] : '#fff' }}
			title={p.title}
			fontSize={'small'}
			className={classes.listItem}
			key={p.title}
		>
			{p.title}
		</Typography>
	)
}
export default function PageTree({ location: loc }) {
	const result = useStaticQuery(graphql`
		{
			allMdx {
				nodes {
					frontmatter {
						title
						slug
						author
					}
				}
			}
		}
	`)

	const pages = getParsedResult(result.allMdx.nodes)
	const classes = useStyles()

	const [location, _] = useState(loc)
	const [currentSelection, setSelection] = useState(`panel-${getLocationPathName(location).split('/')[2]}-header`)

	const directories = [
		...new Set(
			pages
				.filter(p => p.slug && p.slug.includes('/') && p.slug.split('/').length > 3)
				.map(p => p.slug.split('/')[2])
				.filter(d => !!d)
		),
	]

	const handlePanelExpand = panel => (event, newExpanded) => {
		setSelection(newExpanded ? panel : false)
	}

	const pageText = p => (
		<Grid container spacing={1} alignItems={'center'}>
			<Grid item sm={2} style={{ flexBasis: '10%' }}>
				<DoubleArrowIcon fontSize={'small'} style={{ color: getLocationPathName(location) === p.slug ? red[300] : '#fff' }} />
			</Grid>
			<Grid item sm={8}>
				<a href={p.slug.replace('/vibranium/vibranium', '')}>{getLinkText(p, location, classes)}</a>
			</Grid>
		</Grid>
	)

	useEffect(() => {
		setSelection(`panel-${getLocationPathName(location).split('/')[2]}-header`)
	}, [location, setSelection])

	return (
		<>
			{directories.map((dir, i) => (
				<ExpansionPanel
					square
					key={dir}
					className={classes.panelHeader}
					expanded={currentSelection === `panel-${dir}-header`}
					onChange={handlePanelExpand(`panel-${dir}-header`)}
				>
					<ExpansionPanelSummary
						expandIcon={<ExpandMoreIcon style={{ color: 'white' }} />}
						aria-controls={`panel-${dir}-content`}
						id={`panel-${dir}-header`}
					>
						<div className={classes.iconText}>
							<FolderOpen />
							<Typography style={{ marginLeft: '0.5rem' }}> {dir} </Typography>
						</div>
					</ExpansionPanelSummary>
					<ExpansionPanelDetails className={classes.panelBody}>
						<List aria-label="documentation files" dense={true}>
							{pages
								.filter(p => p.slug && p.slug.split('/')[2] === dir && p.slug.split('/').length > 2)
								.sort((a, b) => a.slug.localeCompare(b.slug))
								.map(p => (
									<ListItem key={p.title} style={{ paddingBottom: '2px', paddingTop: '2px', marginTop: '2px', marginBottom: '2px' }}>
										{pageText(p)}
									</ListItem>
								))}
						</List>
					</ExpansionPanelDetails>
				</ExpansionPanel>
			))}
			{pages
				.filter(p => !!p.slug && p.slug.split('/').length < 4)
				.sort((a, b) => a.slug.localeCompare(b.slug))
				.map((p, i) => (
					<ExpansionPanelSummary key={p.title} aria-controls={`panel-${i}-content`} id={`panel-${i}-header`}>
						{pageText(p)}
						<Divider />
					</ExpansionPanelSummary>
				))}
		</>
	)
}
