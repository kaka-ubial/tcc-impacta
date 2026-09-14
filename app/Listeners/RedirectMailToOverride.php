<?php

namespace App\Listeners;

use Illuminate\Mail\Events\MessageSending;
use Symfony\Component\Mime\Address;


class RedirectMailToOverride
{
    public function handle(MessageSending $event): void
    {
        $override = config('mail.override_to');

        if (blank($override)) {
            return;
        }

        $message = $event->message;

        $destinatariosOriginais = collect($message->getTo())
            ->merge($message->getCc())
            ->map(fn (Address $address) => $address->getAddress())
            ->implode(', ');

        if ($destinatariosOriginais === '') {
            return;
        }

        $message->subject("[para: {$destinatariosOriginais}] ".(string) $message->getSubject());

        $aviso = "Este e-mail seria enviado para: {$destinatariosOriginais}";

        if (is_string($html = $message->getHtmlBody())) {
            $message->html($this->comBannerHtml($html, $aviso));
        }

        if (is_string($texto = $message->getTextBody())) {
            $message->text($aviso."\n\n".$texto);
        }

        $message->to(new Address($override));

        if ($message->getCc() !== []) {
            $message->cc();
        }

        if ($message->getBcc() !== []) {
            $message->bcc();
        }
    }

    private function comBannerHtml(string $html, string $aviso): string
    {
        $banner = '<p style="background:#fff3cd;border:1px solid #ffe69c;padding:8px 12px;'
            .'margin:0 0 16px;font-size:13px;color:#664d03;">'.e($aviso).'</p>';

        if (preg_match('/<body[^>]*>/i', $html) === 1) {
            return preg_replace('/(<body[^>]*>)/i', '$1'.$banner, $html, 1);
        }

        return $banner.$html;
    }
}
