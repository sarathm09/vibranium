import React from 'react'
import TextField from '@material-ui/core/TextField'
import Autocomplete from '@material-ui/lab/Autocomplete'
import { useStaticQuery, graphql, navigate } from 'gatsby'
import { makeStyles } from '@material-ui/core'
import { grey } from '@material-ui/core/colors'

const flattenNodeItems = (items, title, slug) => {
	let searchItems = []
	for (let nodeIndex = 0; nodeIndex < items.length; nodeIndex++) {
		const node = items[nodeIndex]
		if (!!node && !!node.title) {
			searchItems.push({
				page: title,
				title: node.title.replace(':', ''),
				url: node.url,
				slug,
			})
		}
		if (!!node && !!node.items && node.items.length > 0) {
			searchItems = [...searchItems, ...flattenNodeItems(node.items, title, slug)]
		}
	}
	return searchItems
}

const useStyles = makeStyles(theme => ({
	searchBox: {
		width: '70%',
		flex: 1,
		marginLeft: '3rem',
		marginRight: '1rem',
		color: grey[200],
		[theme.breakpoints.down('sm')]: {
			visibility: 'hidden',
			width: '0px',
		},
	},
	seachBoxInput: {
		color: `${grey[200]} !important`,
		border: `solid 1px ${grey[700]}`,
		borderRadius: 100,
		paddingLeft: '15px',
		paddingRight: '15px',
	},
	autoCompleteInput: {
		color: grey[200],
	},
}))

export default function SearchBox() {
	const classes = useStyles()
	const tableOfContentsForAllPages = useStaticQuery(graphql`
		{
			allMdx {
				nodes {
					tableOfContents(maxDepth: 100)
					frontmatter {
						slug
						title
					}
				}
			}
		}
	`)
	const searchableItems = tableOfContentsForAllPages.allMdx.nodes
		.map(node => flattenNodeItems(node.tableOfContents.items, node.frontmatter.title, node.frontmatter.slug))
		.reduce((a, b) => [...a, ...b], [])

	return (
		<Autocomplete
			id="search-input"
			size="small"
			color={grey[200]}
			getOptionLabel={option => option.title}
			options={searchableItems.sort((a, b) => -b.page.localeCompare(a.page))}
			groupBy={option => option.page}
			margin="dense"
			className={classes.searchBox}
			onChange={(e, obj) => navigate(`${obj.slug.replace('/vibranium', '')}${obj.url}`)}
			renderInput={params => (
				<TextField
					color="secondary"
					className={classes.seachBoxInput}
					placeholder="Search"
					margin="dense"
					{...params}
					InputProps={{
						...params.InputProps,
						className: classes.autoCompleteInput,
					}}
				/>
			)}
		/>
	)
}
