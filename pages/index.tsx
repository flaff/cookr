import Head from 'next/head'
import "antd/dist/antd.css";

import { fetchIngredients } from '../contentful/ingredients'
import { LinesToMd } from '../components/LinesToMd'
import { fetchMatchingRules } from '../contentful/ingredientCategoryMatchingRule';

export default function Home({ matchingRules }) {
  return (
    <div>`
      <Head>
        <title>Cookr</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <LinesToMd matchingRules={matchingRules} />

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu,
            Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
          background: #f5f5ff;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  )
}

export async function getStaticProps() {
  const matchingRules = await fetchMatchingRules()

  return {
    props: {
      matchingRules,
    },
  }
}
