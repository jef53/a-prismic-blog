import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import { detectContentType } from 'next/dist/server/image-optimizer';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { AiOutlineCalendar, AiOutlineClockCircle, AiOutlineUser } from 'react-icons/ai';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const totalWords = post?.data?.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length;

    const words = contentItem.body.map(item => item.text
      .split(' ').length)

    words.map(word => (total += word));
    return total;
  }, 0)

  const readTime = Math.ceil(totalWords / 200);

  const router = useRouter()

  if (router.isFallback) {
    return (
      <h1>Carregando...</h1>
    )
  }


  return (
    <>

      <main className={styles.container}>
        <Head>
          <title>{post.data.title} Spacetraveling</title>
        </Head>
        <Header />
      </main>


      <br />
      <div className={styles.posts}>
        <strong>{post.data.title}</strong>
        <time>
          <AiOutlineCalendar size={'1.5em'} /><p>{format(
            new Date(post.first_publication_date),
            'dd MMM yyyy',
            { locale: ptBR }
          )}</p>

          <AiOutlineUser size={'1.5em'} /><p>{post.data.author}</p>
          <AiOutlineClockCircle size={'1.5em'} /> <p>{`${readTime} min`}</p>
        </time>
        <div className={styles.content}>
          {post.data.content.map(item => (
            <a key={item.heading}>
              <strong>
                {item.heading}
              </strong>
              <div
                dangerouslySetInnerHTML={{ __html: RichText.asHtml(item.body) }}
              />
            </a>
          )
          )}
        </div>
      </div>

    </>
  )
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('my-posts');

  const paths = posts.results.map(post => {
    return {

      params: {
        slug: post.uid
      }
    }
  })

  return {
    paths,
    fallback: true,
  }
}



export const getStaticProps = async ({ params }) => {
  const prismic = getPrismicClient({});

  const { slug } = params;

  const response = await prismic.getByUID('my-posts', String(slug));
  console.log(response.data.banner)

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response?.data?.banner,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        }
      }),
    },
  }

  return {
    props: {
      post,
    }
  }
}



