import { Helmet } from 'react-helmet'
import { Messages } from 'src/components/messages'
import { SettingForm } from 'src/components/setting-form'
import { InputBox } from 'src/components/input-box'
import { APIKeyDialog } from 'src/components/api-key-dialog'
import { SettingFormSheet } from 'src/components/setting-form/sheet'
import { config } from 'src/config'

export default function Home() {
  return (
    <>
      <Helmet>
        <title>{config.appTitle}</title>
      </Helmet>
      <div className="flex h-full">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative">
            <Messages />
          </div>
          <div className="flex-shrink-0">
            <InputBox />
          </div>
        </div>
        <div className="w-64 border-l border-gray-200 overflow-y-auto">
          <div className="p-4 sticky top-0 bg-white">
            <SettingForm />
          </div>
        </div>
      </div>
      <APIKeyDialog />
      <SettingFormSheet />
    </>
  )
}
