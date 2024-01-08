import { GetStaticProps } from 'next';
import Head from 'next/head';

import Link from 'next/link';
import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { AiOutlineCalendar } from "react-icons/ai";
import { AiOutlineUser } from "react-icons/ai";
import { FiX } from 'react-icons/fi'
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale'
import { useState } from 'react';
import * as Prismic from '@prismicio/client'

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const formattedPost = postsPagination.results.map(post => {
    return {
      ...post,

    }
  })

  const [posts, setPosts] = useState<Post[]>(formattedPost)
  const [nextPage, setNextPage] = useState(postsPagination.next_page)
  const [currentPage, setCurrentPage] = useState(1)

  async function handleNextPage(): Promise<void> {
    if (currentPage !== 1 && nextPage === null) {
      return;
    }

    const postsResults = await fetch(`${nextPage}`).then(
      response => response.json()
    );
    setNextPage(postsResults.next_page);
    setCurrentPage(postsResults.page);

    const newPosts = postsResults.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        }
      }
    })
    setPosts([...posts, ...newPosts])

  }

  return (
    <>
      <Head>
        <title>Home | Spacetraveling</title>
      </Head>


      <main className={styles.container}>
        <Header />
        <div className={styles.posts}>
          {posts.map(post => (
            <a key={post.uid}>
              <Link href={`/post/${post.uid}`}>
                <strong >{post.data.title}</strong>
              </Link>
              <h6>{post.data.subtitle}</h6>
              <AiOutlineCalendar size={'1.5em'} />
              <time>
                {format(
                  new Date(post.first_publication_date),
                  'dd MMM yyyy',
                  { locale: ptBR }
                )}
              </time>
              <AiOutlineUser size={'1.5em'} />
              <p>
                {post.data.author}
              </p>
            </a>
          ))}
          {nextPage && <button onClick={handleNextPage}>
            Carregar mais posts
          </button>}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('my-posts', {
    pageSize: 1,
  }
  )

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date
      ,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }
    }
  })

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  }
 
  return {
    props: {
      postsPagination,
    }
  }
}
