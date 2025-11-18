import { Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';
import classnames from 'classnames';
import { Squash as Hamburger } from 'hamburger-react';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { ColorModeSwitcher } from '../../components/ColorModeSwitcher';
import { Link } from '../../components/common/Link';
import Back from '../../public/back.svg';

const tabs = [
  { key: 'players', label: 'Players', href: '/history/players' },
  { key: 'teams', label: 'Teams', href: '/history/teams' },
  { key: 'comparisons', label: 'Player Comp', href: '/history/comparisons' },
] as const;

const externalLinks = [
  {
    name: 'Forums',
    href: 'https://simulationhockey.com/index.php',
  },
  {
    name: 'Portal',
    href: 'https://portal.simulationhockey.com/',
  },
  {
    name: 'Cards',
    href: 'https://cards.simulationhockey.com/',
  },
] as const;

type HistoryTab = (typeof tabs)[number]['key'];

export const HistoryHeader = () => {
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const activeTab: HistoryTab | undefined = tabs.find(
    (tab) => router.pathname === tab.href,
  )?.key;

  return (
    <div
      className="z-50 h-16 w-full bg-site-header"
      role="navigation"
      aria-label="History"
    >
      <div className="relative mx-auto flex size-full items-center justify-between px-[5%] sm:w-11/12 sm:justify-start sm:p-0 lg:w-3/4">
        <Link href="/" className="hidden h-2/5 w-max sm:inline-block">
          <Back className="top-[5%] mx-2 h-[90%] text-grey100" />
        </Link>

        <div
          className={classnames(
            !drawerVisible && 'hidden',
            'absolute left-0 top-16 z-50 order-1 h-auto w-full flex-col bg-grey800 sm:relative sm:top-0 sm:order-3 sm:flex sm:h-full sm:w-auto sm:flex-row sm:bg-[transparent]',
          )}
        >
          <Link
            href="/"
            _hover={{ textDecoration: 'none' }}
            className="!hover:no-underline flex h-12 w-full items-center justify-center text-sm font-bold capitalize !text-grey100 hover:bg-blue600 sm:hidden"
          >
            Home
          </Link>

          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={classnames(
                activeTab === tab.key &&
                  'border-l-4 border-l-grey100 pr-4 sm:border-b-4 sm:border-l-0 sm:border-b-grey100 sm:pr-[10px] sm:pt-1',
                '!hover:no-underline flex h-12 w-full items-center justify-center px-[10px] text-sm font-bold !text-grey100 hover:bg-blue600 sm:h-full sm:w-max',
              )}
              _hover={{ textDecoration: 'none' }}
            >
              {tab.label}
            </Link>
          ))}

          <div className={classnames(!drawerVisible && 'hidden', 'sm:hidden')}>
            {externalLinks.map(({ name, href }) => (
              <Link
                className={classnames(
                  '!hover:no-underline flex h-12 w-full items-center justify-center px-[10px] text-sm font-bold capitalize !text-grey100 hover:bg-blue600',
                )}
                key={name}
                href={href}
                _hover={{ textDecoration: 'none' }}
                target="_blank"
              >
                {name}
              </Link>
            ))}
          </div>

          <div className="max-md:hidden">
            <Menu>
              <MenuButton className="!hover:no-underline flex h-12 w-full items-center justify-center px-[10px] text-sm font-bold capitalize !text-grey100 hover:bg-blue600 sm:h-full sm:w-max">
                More
              </MenuButton>
              <MenuList>
                {externalLinks.map(({ name, href }) => (
                  <MenuItem
                    className="hover:!bg-highlighted/40 hover:!text-primary"
                    key={name}
                    as="a"
                    href={href}
                    target="_blank"
                  >
                    {name}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
          </div>
        </div>

        <div className="relative order-3 mr-4 sm:ml-auto sm:mr-[2%]">
          <ColorModeSwitcher className="mr-1 !text-grey100 hover:!text-grey900 md:mr-2" />
        </div>

        <div className="inline-block sm:hidden">
          <Hamburger
            toggled={drawerVisible}
            toggle={() =>
              setDrawerVisible((currentVisibility) => !currentVisibility)
            }
            color="#F8F9FA"
            size={24}
          />
        </div>
      </div>
    </div>
  );
};
